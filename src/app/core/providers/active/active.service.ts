import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GetActiveOrderQuery } from '../../../common/generated-types';
import { DataService } from '../data/data.service';

import { GET_ACTIVE_ORDER } from './active.service.graphql';
import {StateService} from "../state/state.service";

@Injectable({
    providedIn: 'root'
})
export class ActiveService {

    activeOrder$: Observable<GetActiveOrderQuery['activeOrder']>;
    language$: Observable<string>;

    constructor(
        private dataService: DataService,
        private stateService: StateService
    ) {
        this.language$ = this.stateService
            .select(state => state.languageCode);

        this.language$.subscribe((language) => {
            this.activeOrder$ = this.dataService.query<GetActiveOrderQuery>(GET_ACTIVE_ORDER, {languageCode: language}).pipe(map(({activeOrder}) => activeOrder));
        });
    }
}
