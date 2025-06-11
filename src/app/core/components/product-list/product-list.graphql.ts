import {gql} from 'apollo-angular';


import { ASSET_FRAGMENT } from '../../../common/graphql/fragments.graphql';

export const SEARCH_PRODUCTS = gql`
    query getProductsForCategory($input: SearchInput!) {
        getProductsForCategory(input: $input) {
            items {
                id
                slug
                productName
                productAsset {
                    ...Asset
                }
                facetValues {
                    id
                    name
                    facet {
                        id
                        name
                        code
                    }
                }
                priceWithTax {
                    min
                    max
                }
                inStock
            }
            totalItems
            facetValues {
                count
                facetValue {
                    id
                    name
                    facet {
                        id
                        name
                        code
                    }
                }
            }
        }
    }
    ${ASSET_FRAGMENT}
`;

export const GET_COLLECTION = gql`
    query GetCollection($id: ID, $slug: String) {
        collection(id: $id, slug: $slug) {
            id
            name
            slug
            description
            featuredAsset {
                ...Asset
            }
            breadcrumbs {
                id
                slug
                name
            }
            children {
                id
                slug
                featuredAsset {
                    ...Asset
                }
                name
            }
            filters {
                args {
                    value
                    name
                }
            }
        }
    }
    ${ASSET_FRAGMENT}
`;
