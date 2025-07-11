import {Injectable, LOCALE_ID, Inject} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
// import {TranslateService} from "@ngx-translate/core";

export interface AppState {
    signedIn: boolean;
    activeOrderId: string | null;
    lastCollectionSlug: string | null;
    lastCollectionId: string;
    mobileNavMenuIsOpen: boolean;
    cartDrawerOpen: boolean;
    languageCode: string;
}

export const initialState: AppState = {
    signedIn: false,
    activeOrderId: null,
    lastCollectionSlug: null,
    lastCollectionId: '',
    mobileNavMenuIsOpen: false,
    cartDrawerOpen: false,
    languageCode: 'el'
};

/**
 * A simple, observable store of global app state.
 */
@Injectable({
    providedIn: 'root',
})
export class StateService {
    private state: AppState = initialState;
    private readonly stateSubject: BehaviorSubject<AppState>;

    constructor(
        // private translate: TranslateService,
        @Inject(LOCALE_ID) public locale: string
    ) {
        if (typeof window !== 'undefined') {
            Object.defineProperty(window, 'appState', {
                get: () => this.stateSubject.value,
            });

            this.state.languageCode = this.locale;
            this.stateSubject = new BehaviorSubject<AppState>(initialState);

            // translate.setDefaultLang(localStorage.languageCode || 'el');
        }
    }

    setState<T extends keyof AppState>(key: T, value: AppState[T]) {
        this.state[key] = value;
        this.stateSubject.next(this.state);
    }

    select<R>(selector: (state: AppState) => R): Observable<R> {
        return this.stateSubject.pipe(
            map(selector),
            distinctUntilChanged(),
        );
    }
}
