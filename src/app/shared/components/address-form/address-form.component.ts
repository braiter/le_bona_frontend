import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import { AddressFragment, CountryFragment, OrderAddressFragment } from '../../../common/generated-types';
import {Observable} from "rxjs";
import {StateService} from "../../../core/providers/state/state.service";

@Component({
    selector: 'vsf-address-form',
    templateUrl: './address-form.component.html',
    // styleUrls: ['./address-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressFormComponent implements OnChanges {

    @Input() availableCountries: CountryFragment[];
    @Input() address: OrderAddressFragment | AddressFragment;

    language$: Observable<string>;
    addressForm: UntypedFormGroup;
    constructor(
        private formBuilder: UntypedFormBuilder,
        private stateService: StateService,
    ) {
        this.addressForm = this.formBuilder.group({
            fullName: '',
            company: '',
            streetLine1: ['', Validators.required],
            streetLine2: '',
            city: ['', Validators.required],
            province: '',
            postalCode: ['', Validators.required],
            countryCode: ['', Validators.required],
            phoneNumber: '',
        });
    }
    async ngOnInit() {
        this.language$ = this.stateService
            .select(state => state.languageCode);
    }

    ngOnChanges(changes: SimpleChanges) {
        if ('address' in changes && this.addressForm && this.address) {
            this.addressForm.patchValue(this.address, { });
        }
        const country = this.address && this.address.country;
        if (country && this.availableCountries) {
            if (country && typeof country !== 'string') {
                this.addressForm.patchValue({
                    countryCode: country.code,
                });
            } else {
                const matchingCountry = this.availableCountries.find(c => c.name === country);
                if (matchingCountry) {
                    this.addressForm.patchValue({
                        countryCode: matchingCountry.code,
                    });
                }
            }
        }
    }

}
