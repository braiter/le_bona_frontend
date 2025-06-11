import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import {map, switchMap} from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { GetCollectionsQuery } from '../../../common/generated-types';
import { DataService } from '../../providers/data/data.service';
import {StateService} from "../../providers/state/state.service";

@Component({
    selector: 'vsf-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit {

    collections$: Observable<GetCollectionsQuery['collections']['items']>;
    heroImage: SafeUrl;
    language$: Observable<string>;

    constructor(
        private dataService: DataService,
        private stateService: StateService,
    ) {}

    ngOnInit(): void {
        this.language$ = this.stateService
            .select(state => state.languageCode);


        this.collections$ = this.language$.pipe(switchMap(language => {
            console.log(language);
            this.heroImage = this.getHeroImageUrl();
            return this.dataService.query<GetCollectionsQuery>(GET_COLLECTIONS, {
                options: { take: 50, topLevelOnly: true }, languageCode: language
            }, 'network-only').pipe(map(({collections}) => collections.items));
        }));


    }

    private getHeroImageUrl(): string {
        const {apiHost, apiPort} = environment;
        // return `${apiHost}:${apiPort}/assets/preview/a2/thomas-serer-420833-unsplash__preview.jpg`;
        return `${apiHost}:${apiPort}/assets/preview/d7/main_page__preview.jpg?preset=medium`;
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
