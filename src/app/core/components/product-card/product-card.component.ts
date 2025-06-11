import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { SearchProductsQuery, Product, GetProductDetailQuery } from '../../../common/generated-types';
import {type} from "os";
import {isBoolean} from "util";

@Component({
    selector: 'vsf-product-card',
    templateUrl: './product-card.component.html',
    styleUrls: ['./product-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {

    @Input() product: SearchProductsQuery['getProductsForCategory']['items'][number];
    @Input() language: string | null;

    typeOf(model: any) {
        return typeof model;
    }

    protected readonly isNaN = isNaN;
}
