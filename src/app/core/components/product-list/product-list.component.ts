import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, merge, Observable, of } from 'rxjs';
import { distinctUntilChanged, map, mapTo, scan, share, shareReplay, skip, switchMap, take, tap, } from 'rxjs/operators';

import {
    GetCollectionQuery,
    GetCollectionQueryVariables,
    SearchProductsQuery,
    SearchProductsQueryVariables
} from '../../../common/generated-types';
import { getRouteArrayParam } from '../../../common/utils/get-route-array-param';
import { AssetPreviewPipe } from '../../../shared/pipes/asset-preview.pipe';
import { DataService } from '../../providers/data/data.service';
import { StateService } from '../../providers/state/state.service';

import { GET_COLLECTION, SEARCH_PRODUCTS } from './product-list.graphql';

type SearchItem = SearchProductsQuery['getProductsForCategory']['items'][number];

@Component({
    selector: 'vsf-product-list',
    templateUrl: './product-list.component.html',
styleUrls: ['./product-list.component.scss'],
    })
export class ProductListComponent implements OnInit {
    products$: Observable<SearchItem[]>;
    totalResults = 0;
    collection$: Observable<GetCollectionQuery['collection']>;
    facetValues: SearchProductsQuery['getProductsForCategory']['facetValues'];
    unfilteredTotalItems = 0;
    activeFacetValueIds$: Observable<string[]>;
    searchTerm$: Observable<string>;
    displayLoadMore$: Observable<boolean>;
    loading = false;
    breadcrumbs$: Observable<Array<{id: string; name: string; }>>;
    mastheadBackground$: Observable<SafeStyle>;
    language$: Observable<string>;
    private currentPage = 0;
    private refresh = new BehaviorSubject<void>(undefined);
    readonly placeholderProducts = Array.from({ length: 12 }).map(() => null);

    constructor(private dataService: DataService,
                private route: ActivatedRoute,
                private stateService: StateService,
                private sanitizer: DomSanitizer) { }

    ngOnInit() {
        const perPage = 24;
        const collectionSlug$ = this.route.paramMap.pipe(
            map(pm => pm.get('slug')),
            distinctUntilChanged(),
            tap(slug => {
                this.stateService.setState('lastCollectionSlug', slug || null);
                this.currentPage = 0;
            }),
            shareReplay(1),
        );
        this.activeFacetValueIds$ = this.route.paramMap.pipe(
            map(pm => getRouteArrayParam(pm, 'facets')),
            distinctUntilChanged((x, y) => x.toString() === y.toString()),
            tap(() => {
                this.currentPage = 0;
            }),
            shareReplay(1),
        );
        this.searchTerm$ = this.route.queryParamMap.pipe(
            map(pm => pm.get('search') || ''),
            distinctUntilChanged(),
            shareReplay(1),
        );

        this.collection$ = collectionSlug$.pipe(
            switchMap(slug => {
                if (slug) {
                    return this.language$.pipe(switchMap(language => {
                        // this.currentPage = 0;
                        return this.dataService.query<GetCollectionQuery, GetCollectionQueryVariables>(GET_COLLECTION, {
                            slug, languageCode: language
                        }, 'network-only').pipe(
                            map(data => data.collection),
                        );
                    }));
                } else {
                    return of(undefined);
                }
            })
        );

        const assetPreviewPipe = new AssetPreviewPipe();

        this.mastheadBackground$ = this.collection$.pipe(
            map(c => 'url(' + assetPreviewPipe.transform(c?.featuredAsset || undefined, 1000, 300) + ')'),
            map(style => this.sanitizer.bypassSecurityTrustStyle(style)),
        );

        this.breadcrumbs$ = this.collection$.pipe(
            map(collection => {
                if (collection) {
                    this.stateService.setState('lastCollectionId', collection.id);
                    return collection.breadcrumbs;
                } else {
                    return [{
                        id: '',
                        name: 'Home',
                    }, {
                        id: '',
                        name: 'Search',
                    }];
                }
            }),
        );

        this.language$ = this.stateService
            .select(state => state.languageCode);

        const triggerFetch$ = combineLatest(this.collection$, this.activeFacetValueIds$, this.searchTerm$, this.refresh, this.language$);
        const getInitialFacetValueIds = () => {
            combineLatest(this.collection$, this.searchTerm$, this.language$).pipe(
                take(1),
                switchMap(([collection, term, language]) => {
                    this.loading = true;
                    return this.dataService.query<SearchProductsQuery, SearchProductsQueryVariables>(SEARCH_PRODUCTS, {
                        input: {
                            term,
                            groupByProduct: true,
                            collectionId: collection?.id,
                            take: perPage,
                            skip: this.currentPage * perPage,
                        },
                        languageCode: language
                    }, 'network-only');
                }),
            ).subscribe(data => {
                this.loading = false;
                this.facetValues = data.getProductsForCategory.facetValues.filter(item => item.facetValue.facet.code === 'product-color');
                // this.unfilteredTotalItems = data.getProductsForCategory.totalItems;
            });
        };
        const queryResult$ = triggerFetch$.pipe(
            switchMap(([collection, facetValueIds, term, refresh, language]) => {
                this.loading = true;

                return this.dataService.query<SearchProductsQuery, SearchProductsQueryVariables>(SEARCH_PRODUCTS, {
                    input: {
                        term,
                        groupByProduct: true,
                        collectionId: collection?.id,
                        facetValueFilters: facetValueIds.map(id => ({ and: id })),
                        take: perPage,
                        skip: this.currentPage * perPage,
                    },
                    languageCode: language
                },'network-only').pipe(
                    tap(data => {
                        this.loading = false;
                        this.totalResults = data.getProductsForCategory.totalItems;

                        if (!this.facetValues) {
                            getInitialFacetValueIds();
                        } else {
                            this.facetValues = this.facetValues.map(fv => fv);
                        }
                    }),
                );
            }),
            shareReplay(1),
        );

        const RESET = 'RESET';
        const items$ = this.products$ = queryResult$
            .pipe(
                map((search) => {
                    return search.getProductsForCategory.items
                        .map(item => {
                            const color = item.facetValues
                                .find(facet => facet.facet.code === 'hex-code');

                            return {
                                ...item,
                                color: color? color.name: null
                            };
                        });
                }),
            );
        const reset$ = merge(collectionSlug$, this.activeFacetValueIds$, this.searchTerm$, this.language$).pipe(
            mapTo(RESET),
            skip(3),
            share(),
        );
        this.displayLoadMore$ = combineLatest(this.products$).pipe(
            map(([products]) => {
                return 0 < products.length && products.length < this.totalResults;
            }),
        );

        this.products$ = merge(items$, reset$).pipe(
            scan<SearchItem[] | string, SearchItem[]>((acc, val) => {
                console.log(val);
                if (typeof val === 'string') {
                    return [];
                } else {
                    // if (acc.length !== val.length) {
                        return acc.concat(val);
                    // } else {
                    //     return acc;
                    // }
                }
            }, [] as SearchItem[]),
        );
    }

    trackByProductId(index: number, item: SearchItem) {
        return item.productId;
    }

    loadMore() {
        this.currentPage ++;
        this.refresh.next();
    }

}
