import { Provider, signal } from '@angular/core';
import { of } from 'rxjs';
import { I18nLanguage, LanguageCode } from '../core/i18n/i18n.model';
import { I18nService } from '../core/i18n/i18n.service';

export const FOUNDATION_TEST_MESSAGES: Readonly<Record<string, string>> = {
  'app.name': 'Personal Workspace',
  'foundation.title': 'Workspace is ready',
  'foundation.description': 'The foundation infrastructure is connected.',
  'language.label': 'Language',
  'theme.toggle': 'Toggle theme',
  'theme.light': 'Light theme',
  'theme.dark': 'Dark theme',
  'shared.close': 'Close',
  'shared.loading': 'Loading',
  'shared.retry': 'Retry',
  'unsavedChanges.confirmDiscard': 'Discard unsaved changes?',
  'error.generic': 'Something went wrong.',
  'error.notFound': 'Page not found.',
};

export function provideI18nTesting(
  messages: Readonly<Record<string, string>> = FOUNDATION_TEST_MESSAGES,
): Provider {
  const language = signal<LanguageCode | null>('en');
  const languages = signal<readonly I18nLanguage[]>([
    { code: 'ru', label: 'Русский' },
    { code: 'en', label: 'English' },
  ]);
  return {
    provide: I18nService,
    useValue: {
      language,
      languages,
      startupState: signal<'ready'>('ready'),
      translate: (key: string): string => messages[key] ?? key,
      switchLanguage: (next: LanguageCode) => {
        language.set(next);
        return of(void 0);
      },
      retryStartup: () => of(void 0),
      dateLocale: (): string => 'en-US',
    },
  };
}
