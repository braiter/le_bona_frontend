import { Pipe, PipeTransform } from '@angular/core';

import { ProductsForColorsFragment } from '../../common/generated-types';

@Pipe({
    name: 'getProductColor',
})
export class GetProductColorPipe implements PipeTransform {
    transform(product?: ProductsForColorsFragment): any {
        if (!product) {
            return '';
        }

        return product.facetValues.find(facet => facet.facet.code === 'hex-code')?.code;
    }
}
