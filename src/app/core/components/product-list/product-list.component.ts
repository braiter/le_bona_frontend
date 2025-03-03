import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, merge, Observable, of } from 'rxjs';
import { distinctUntilChanged, map, mapTo, scan, share, shareReplay, skip, switchMap, take, tap, } from 'rxjs/operators';

import {
    FacetValue,
    GetCollectionQuery,
    GetCollectionQueryVariables, GetProductColorsQuery, GetProductColorsQueryVariables,
    SearchProductsQuery,
    SearchProductsQueryVariables,
    Facet
} from '../../../common/generated-types';
import { getRouteArrayParam } from '../../../common/utils/get-route-array-param';
import { AssetPreviewPipe } from '../../../shared/pipes/asset-preview.pipe';
import { DataService } from '../../providers/data/data.service';
import { StateService } from '../../providers/state/state.service';

import { GET_COLLECTION, SEARCH_PRODUCTS } from './product-list.graphql';
import {GET_PRODUCT_COLORS} from "../product-detail/product-detail.graphql";

type SearchItem = SearchProductsQuery['search']['items'][number];

@Component({
    selector: 'vsf-product-list',
    templateUrl: './product-list.component.html',
styleUrls: ['./product-list.component.scss'],
    })
export class ProductListComponent implements OnInit {
    products$: Observable<SearchItem[]>;
    products: Array<any>;
    totalResults$: Observable<number>;
    collection$: Observable<GetCollectionQuery['collection']>;
    facetValues: SearchProductsQuery['search']['facetValues'];
    unfilteredTotalItems = 0;
    activeFacetValueIds$: Observable<string[]>;
    searchTerm$: Observable<string>;
    displayLoadMore$: Observable<boolean>;
    loading$: Observable<boolean>;
    breadcrumbs$: Observable<Array<{id: string; name: string; }>>;
    mastheadBackground$: Observable<SafeStyle>;
    colors$: Observable<any>;
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
            combineLatest(this.collection$, this.searchTerm$).pipe(
                take(1),
                switchMap(([collection, term]) => {
                    return this.dataService.query<SearchProductsQuery, SearchProductsQueryVariables>(SEARCH_PRODUCTS, {
                        input: {
                            term,
                            groupByProduct: true,
                            collectionId: collection?.id,
                            take: perPage,
                            skip: this.currentPage * perPage,
                        },
                    });
                }),
            ).subscribe(data => {
                this.facetValues = data.search.facetValues.filter(item => item.facetValue.facet.name !== 'hex-code');
                this.unfilteredTotalItems = data.search.totalItems;
            });
        };
        this.loading$ = merge(
            triggerFetch$.pipe(mapTo(true)),
        );
        const queryResult$ = triggerFetch$.pipe(
            switchMap(([collection, facetValueIds, term, refresh, language]) => {
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
                        if (facetValueIds.length === 0) {
                            this.facetValues = data.search.facetValues.filter(item => item.facetValue.facet.name !== 'hex-code');
                            this.unfilteredTotalItems = data.search.totalItems;
                        } else if (!this.facetValues) {
                            getInitialFacetValueIds();
                        } else {
                            this.facetValues = this.facetValues.map(fv => fv);
                        }
                    }),
                );
            }),
            shareReplay(1),
        );

        this.loading$ = merge(
            triggerFetch$.pipe(mapTo(true)),
            queryResult$.pipe(mapTo(false)),
        );

        this.colors$ = combineLatest(this.collection$, this.language$).pipe(
            switchMap(([collection, language]) => {
                const facetId = collection?.filters[0].args.find(facet => facet.name === 'facetValueIds');
                console.log(facetId);

                return this.dataService.query<GetProductColorsQuery, GetProductColorsQueryVariables>(GET_PRODUCT_COLORS, {
                    id: facetId? JSON.parse(facetId?.value ? facetId?.value: '')[0]: null,
                    languageCode: language
                },'network-only');
            }),
            map(data => data.colors)
        );

        const RESET = 'RESET';



        const items$ = this.products$ = combineLatest(queryResult$, this.colors$)
            .pipe(
                map(([search, colorGroups]) => {
                    return search.search.items
                        .map(item => {
                            const colorId = item.facetValueIds[item.facetValueIds.length - 1];

                            const products = colorGroups.reduce(
                                (accumulator: Array<any>, currentValue: {name: string; products: Array<any>}) => accumulator.concat(currentValue.products),
                                [],
                            );

                            const product = products.find((product: any) => product.facetValues.find((facet: any) => facet.id === colorId));
                            let color;
                            if (product) {
                                color = product.facetValues.find((facet: any) => facet.id === colorId);
                            }

                            return {
                                ...item,
                                color: color? color.name: null
                            };
                        });
                })
            );
        const reset$ = merge(collectionSlug$, this.activeFacetValueIds$, this.searchTerm$, this.language$).pipe(
            mapTo(RESET),
            skip(1),
            share(),
        );

        this.products$ = merge(items$, reset$).pipe(
            scan<SearchItem[] | string, SearchItem[]>((acc, val) => {
                if (typeof val === 'string') {
                    return [];
                } else {
                    return acc.concat(val);
                }
            }, [] as SearchItem[]),
        );

        this.totalResults$ = queryResult$.pipe(map(data => data.search.totalItems));
        this.displayLoadMore$ = combineLatest(this.products$, this.totalResults$).pipe(
            map(([products, totalResults]) => {
                return 0 < products.length && products.length < totalResults;
            }),
        );
    }

    trackByProductId(index: number, item: SearchItem) {
        return item.productId;
    }

    loadMore() {
        this.currentPage ++;
        this.refresh.next();
    }

    async getColor(colorId: string, colors: Array<any>) {
        let color: FacetValue | null = null;
        return new Promise(resolve => {
            colors.forEach((colorGroup: {name: string; products: Array<any>}) => {
                if (!color) {
                    colorGroup.products.forEach(product => {
                        if (!color) {
                            color = product.facetValues.find((facet: FacetValue) => facet.id === colorId);
                        }

                        if (color) {
                            resolve(color);
                        }
                    });
                }
            });
        });
    }
}
