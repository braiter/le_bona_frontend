import {ChangeDetectionStrategy, Component} from '@angular/core';
import {Observable} from "rxjs";
import {GetCollectionsQuery} from "../../../common/generated-types";
import {DataService} from "../../providers/data/data.service";
import {map} from "rxjs/operators";
import {gql} from "apollo-angular";

@Component({
    selector: 'vsf-collections-list-page',
    templateUrl: './collections-list-page.component.html',
    styleUrls: ['./collections-list-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionsListPageComponent {
    collections$: Observable<GetCollectionsQuery['collections']['items']>;

    constructor(private dataService: DataService) {
        this.collections$ = this.dataService.query<GetCollectionsQuery>(GET_COLLECTIONS, {
            options: {take: 50},
        }).pipe(map(({collections}) => collections.items));
    }
}

const GET_COLLECTIONS = gql`
    query GetCollections($options: CollectionListOptions) {
        collections(options: $options) {
            items {
                id
                name
                slug
                parent {
                    id
                    slug
                    name
                }
                featuredAsset {
                    id
                    preview
                }
            }
        }
    }
`;