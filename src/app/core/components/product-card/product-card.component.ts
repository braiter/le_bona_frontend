import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { SearchProductsQuery, Product, GetProductDetailQuery } from '../../../common/generated-types';

@Component({
    selector: 'vsf-product-card',
    templateUrl: './product-card.component.html',
    styleUrls: ['./product-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {

    @Input() product: SearchProductsQuery['search']['items'][number];
    @Input() language: string | null;
}
