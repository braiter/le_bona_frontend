import {gql} from 'apollo-angular';


import { ASSET_FRAGMENT, CART_FRAGMENT, ERROR_RESULT_FRAGMENT } from '../../../common/graphql/fragments.graphql';
const languageCode = 'el';

export const GET_PRODUCT_DETAIL = gql`
    query GetProductDetail($slug: String!) {
        product(slug: $slug) {
            id
            name
            description
            variants {
                id
                name
                options {
                    group {
                        code
                        name
                    }
                    code
                    name
                }
                price
                priceWithTax
                sku
                stockLevel
                assets {
                    ...Asset
                }
            }
            facetValues {
                code
                name
                id
                facet {
                    code
                    name
                }
            }
            featuredAsset {
                ...Asset
            }
            assets {
                ...Asset
            }
            collections {
                id
                slug
                breadcrumbs {
                    id
                    name
                    slug
                }
            }
            languageCode
        }
    }
    ${ASSET_FRAGMENT}
`;

export const ADD_TO_CART = gql`
    mutation AddToCart($variantId: ID!, $qty: Int!) {
        addItemToOrder(productVariantId: $variantId, quantity: $qty) {
            ...Cart
            ...ErrorResult
            ...on InsufficientStockError {
                order {
                    ...Cart
                }
            }
        }
    }
    ${CART_FRAGMENT}
    ${ERROR_RESULT_FRAGMENT}
`;

export const GET_PRODUCT_COLORS = gql`
    query FindColors($id: ID) {
        colors(id: $id) {
            name
            id
            products {
                facetValues {
                    code
                    name
                    id
                    facet {
                        code
                        name
                    }
                }
                translations {
                    languageCode
                    slug
                    name
                }
                variants {
                    stockLevel
                }
            }
        }
    }
`;
