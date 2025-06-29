import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import {map, switchMap} from 'rxjs/operators';

import { GetOrderForCheckoutQuery } from '../../common/generated-types';
import { DataService } from '../../core/providers/data/data.service';
import { StateService } from '../../core/providers/state/state.service';
import { CheckoutConfirmationComponent } from '../components/checkout-confirmation/checkout-confirmation.component';
import { CheckoutPaymentComponent } from '../components/checkout-payment/checkout-payment.component';
import { CheckoutShippingComponent } from '../components/checkout-shipping/checkout-shipping.component';
import { CheckoutSignInComponent } from '../components/checkout-sign-in/checkout-sign-in.component';

import { GET_ORDER_FOR_CHECKOUT } from './checkout-resolver.graphql';

@Injectable({ providedIn: 'root' })
export class CheckoutGuard  {
    language$: Observable<string>;

    constructor(private router: Router,
                private dataService: DataService,
                private stateService: StateService) {}

    canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
        return this.stateService
            .select(state => state.languageCode)
            .pipe(
                switchMap((language: string) => {
                    const orderState$ = this.dataService.query<GetOrderForCheckoutQuery>(GET_ORDER_FOR_CHECKOUT, {languageCode: language}, 'cache-first').pipe(
                        map(data => data.activeOrder ? data.activeOrder.state : 'AddingItems'),
                    );
                    const signedIn$ = this.stateService.select(state => state.signedIn);
                    return combineLatest(orderState$, signedIn$).pipe(
                        map(([orderState, signedIn]) => {
                            const component = route.component;

                            if (component === CheckoutSignInComponent) {
                                if (signedIn) {
                                    this.router.navigate(['/checkout', 'shipping']);
                                    return false;
                                } else {
                                    if (orderState === 'AddingItems') {
                                        return true;
                                    } else if (orderState === 'ArrangingPayment') {
                                        this.router.navigate(['/checkout', 'payment']);
                                        return false;
                                    } else {
                                        return false;
                                    }
                                }
                            } else if (component === CheckoutShippingComponent) {
                                if (orderState === 'AddingItems') {
                                    return true;
                                } else if (orderState === 'ArrangingPayment') {
                                    this.router.navigate(['/checkout', 'payment']);
                                    return false;
                                } else {
                                    return false;
                                }
                            } else if (component === CheckoutPaymentComponent) {
                                if (orderState === 'ArrangingPayment') {
                                    return true;
                                } else if (orderState === 'AddingItems') {
                                    this.router.navigate(['/checkout']);
                                    return false;
                                } else {
                                    return false;
                                }
                            } else if (component === CheckoutConfirmationComponent) {
                                return true;
                            }

                            return true;
                        }),
                    );
                })
            );
    }
}
