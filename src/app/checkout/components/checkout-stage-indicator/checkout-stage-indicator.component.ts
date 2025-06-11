import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {TransitionToAddingItemsMutation} from "../../../common/generated-types";
import {TRANSITION_TO_ADDING_ITEMS} from "../checkout-process/checkout-process.graphql";
import {DataService} from "../../../core/providers/data/data.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable} from "rxjs";
import {StateService} from "../../../core/providers/state/state.service";

@Component({
    selector: 'vsf-checkout-stage-indicator',
    templateUrl: './checkout-stage-indicator.component.html',
    // styleUrls: ['./checkout-stage-indicator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutStageIndicatorComponent  {
    @Input() signedIn = false;
    @Input() activeStage = 1;

    language$: Observable<string>;

    constructor(
        private dataService: DataService,
        private router: Router,
        private route: ActivatedRoute,
        private stateService: StateService) {}

    ngOnInit() {
        this.language$ = this.stateService
            .select(state => state.languageCode);
    }

    backToShipping() {
        this.dataService.mutate<TransitionToAddingItemsMutation>(TRANSITION_TO_ADDING_ITEMS).subscribe(() => {
            this.router.navigate(['./shipping'], { relativeTo: this.route });
        });
    }
}
