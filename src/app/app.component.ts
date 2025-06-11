import { Component, OnInit, LOCALE_ID } from '@angular/core';
import { Router, RouterEvent } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { GetCollectionsQuery, GetCollectionsQueryVariables } from './common/generated-types';
import { GET_COLLECTIONS } from './common/graphql/documents.graphql';
import { DataService } from './core/providers/data/data.service';
import { StateService } from './core/providers/state/state.service';

@Component({
    selector: 'vsf-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    cartDrawerVisible$: Observable<boolean>;
    mobileNavVisible$: Observable<boolean>;
    isHomePage$: Observable<boolean>;
    topCollections$: Observable<GetCollectionsQuery['collections']['items']>;

    locale = 'en';

    navigation = {
        support: [
            {name: 'Help', href: '#'},
            {name: 'Track order', href: '#'},
            {name: 'Shipping', href: '#'},
            {name: 'Returns', href: '#'},
        ],
        company: [
            {name: 'About', href: '#'},
            {name: 'Contacts', href: '#'},
            // {name: 'Blog', href: '#'},
            // {name: 'Corporate responsibility', href: '#'},
            // {name: 'Press', href: '#'},
        ],
        topMenu: [
            {key: $localize`header.top_menu.products`, href: '/categories', active: false},
            {key: $localize`header.top_menu.about`, href: '/about', active: false},
            {key: $localize`header.top_menu.contacts`, href: '/contacts', active: false},
        ]
    };

    constructor(private router: Router,
                private stateService: StateService,
                private dataService: DataService) {
    }

    ngOnInit(): void {
        this.cartDrawerVisible$ = this.stateService.select(state => state.cartDrawerOpen);
        this.mobileNavVisible$ = this.stateService.select(state => state.mobileNavMenuIsOpen);
        this.isHomePage$ = this.router.events.pipe(
            filter<any>(event => event instanceof RouterEvent),
            map((event: RouterEvent) => event.url === '/'),
        );
        this.topCollections$ = this.dataService.query<GetCollectionsQuery, GetCollectionsQueryVariables>(GET_COLLECTIONS, {
            options: {take: 25, topLevelOnly: true}
        }).pipe(
            map(({collections}) => collections.items)
        );

        this.stateService
            .select(state => state.languageCode)
            .subscribe((language) => {this.locale  = language});
    }

    openCartDrawer() {
        this.stateService.setState('cartDrawerOpen', true);
    }

    closeCartDrawer() {
        this.stateService.setState('cartDrawerOpen', false);
    }
}
