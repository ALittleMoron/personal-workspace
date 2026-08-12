import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { of } from 'rxjs';
import { appConfig } from './app.config';
import { I18nService } from './core/i18n/i18n.service';

@Component({ selector: 'app-config-test-host', standalone: true, template: '' })
class AppConfigTestHostComponent {}

describe('appConfig', () => {
  let originalBody: string;

  beforeEach(() => {
    originalBody = document.body.innerHTML;
    document.body.innerHTML = '<app-config-test-host></app-config-test-host>';
  });

  afterEach(() => {
    document.body.innerHTML = originalBody;
  });

  it('initializes localization while bootstrapping the browser application', async () => {
    const initialize = jest.fn(() => of(void 0));
    const application = await bootstrapApplication(AppConfigTestHostComponent, {
      providers: [
        ...appConfig.providers,
        provideRouter([], withDisabledInitialNavigation()),
        {
          provide: I18nService,
          useValue: {
            initialize,
            language: signal<'ru' | 'en'>('ru'),
            translate: (key: string) => key,
          },
        },
      ],
    });
    application.destroy();

    expect(initialize).toHaveBeenCalledTimes(1);
  });
});
