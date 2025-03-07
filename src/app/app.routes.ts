import { Route } from '@angular/router';

import { ProductDetailComponent } from './core/components/product-detail/product-detail.component';
import { ProductListComponent } from './core/components/product-list/product-list.component';
import {CollectionsListPageComponent} from "./core/components/collections-list-page/collections-list-page.component";

export const routes: Route[] = [
    {
        path: 'category/:slug',
        component: ProductListComponent,
        pathMatch: 'full',
    },
    {
        path: 'categories',
        component: CollectionsListPageComponent,
        pathMatch: 'full',
    },
    {
        path: 'search',
        component: ProductListComponent,
    },
    {
        path: 'product/:slug',
        component: ProductDetailComponent,
    },
    {
        path: 'account',
        loadChildren: () => import('./account/account.module').then(m => m.AccountModule),
    },
    {
        path: 'checkout',
        loadChildren: () => import('./checkout/checkout.module').then(m => m.CheckoutModule),
    },
];
