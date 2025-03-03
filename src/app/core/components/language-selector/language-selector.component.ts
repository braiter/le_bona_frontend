import { ChangeDetectionStrategy, Component } from '@angular/core';
import {StateService} from "../../providers/state/state.service";
import { NgEventBus } from 'ng-event-bus';

@Component({
  selector: 'vsf-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageSelectorComponent {
  languageCode = '';

  constructor(
      private stateService: StateService,
      private eventBus: NgEventBus
  ) {}

  ngOnInit() {
    this.stateService
        .select(state => state.languageCode)
        .subscribe((language) => {this.languageCode = language});
  }

  selectLanguage (language: string) {
    this.stateService.setState('languageCode', language);
    localStorage.setItem('languageCode', language);
    this.eventBus.cast('languageChanged', language);
  }
}
