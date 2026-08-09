import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { ApiClient } from '../http/api-client.service';
import {
  I18nBundleDto,
  I18nLanguage,
  I18nLanguagesDto,
  I18nParams,
  LanguageCode,
  isLanguageCode,
} from './i18n.model';

const STORAGE_KEY = 'chosenLanguage';
const BOOTSTRAP_MESSAGES: Readonly<Record<LanguageCode, Readonly<Record<string, string>>>> = {
  ru: {
    'error.generic': 'Не удалось загрузить текст интерфейса.',
    'shared.retry': 'Повторить',
  },
  en: {
    'error.generic': 'Unable to load interface text.',
    'shared.retry': 'Retry',
  },
};

export type I18nStartupState = 'loading' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly api = inject(ApiClient);
  private readonly document = inject(DOCUMENT);
  private readonly messages = signal<Readonly<Record<string, string>>>({});
  private readonly bundleCache = new Map<LanguageCode, Readonly<Record<string, string>>>();

  readonly language = signal<LanguageCode | null>(null);
  readonly languages = signal<readonly I18nLanguage[]>([]);
  readonly startupState = signal<I18nStartupState>('loading');

  initialize(): Observable<void> {
    this.startupState.set('loading');
    if (this.language() === null) this.document.documentElement.lang = this.bootstrapLanguage();
    return this.api.get<I18nLanguagesDto>('/api/i18n/languages').pipe(
      switchMap((response) => {
        this.assertLanguagesResponse(response);
        this.languages.set(response.languages);
        return this.loadLanguage(this.resolveInitialLanguage(response), true);
      }),
      tap(() => this.startupState.set('ready')),
      catchError(() => {
        this.startupState.set('error');
        return of(void 0);
      }),
    );
  }

  retryStartup(): Observable<void> {
    return this.initialize();
  }

  switchLanguage(language: LanguageCode): Observable<void> {
    if (!this.languages().some((item) => item.code === language)) {
      return throwError(() => new Error(`Unsupported language: ${language}`));
    }
    return this.loadLanguage(language, true);
  }

  translate(key: string, params?: I18nParams): string {
    const bootstrapMessage =
      this.startupState() === 'ready'
        ? undefined
        : BOOTSTRAP_MESSAGES[this.bootstrapLanguage()][key];
    return interpolate(this.messages()[key] ?? bootstrapMessage ?? key, params);
  }

  dateLocale(): string {
    return this.language() === 'en' ? 'en-US' : 'ru-RU';
  }

  private loadLanguage(language: LanguageCode, persist: boolean): Observable<void> {
    const cached = this.bundleCache.get(language);
    if (cached !== undefined) {
      this.applyBundle(language, cached, persist);
      return of(void 0);
    }
    return this.api.get<I18nBundleDto>(`/api/i18n/bundles/${language}`).pipe(
      tap((bundle) => {
        if (bundle.language !== language) {
          throw new Error(`Unexpected language bundle: ${bundle.language}`);
        }
        this.bundleCache.set(language, bundle.messages);
        this.applyBundle(language, bundle.messages, persist);
      }),
      map(() => void 0),
    );
  }

  private applyBundle(
    language: LanguageCode,
    messages: Readonly<Record<string, string>>,
    persist: boolean,
  ): void {
    if (persist) this.persistLanguage(language);
    this.messages.set(messages);
    this.language.set(language);
    this.document.documentElement.lang = language;
  }

  private resolveInitialLanguage(response: I18nLanguagesDto): LanguageCode {
    const stored = this.readStoredLanguage();
    if (isLanguageCode(stored) && response.languages.some((item) => item.code === stored)) {
      return stored;
    }
    return response.defaultLanguage;
  }

  private bootstrapLanguage(): LanguageCode {
    const stored = this.readStoredLanguage();
    if (isLanguageCode(stored)) return stored;
    const browserLanguage = this.document.defaultView?.navigator?.language;
    return browserLanguage?.toLowerCase().startsWith('ru') === true ? 'ru' : 'en';
  }

  private readStoredLanguage(): string | null {
    try {
      return this.storage()?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  private persistLanguage(language: LanguageCode): void {
    try {
      this.storage()?.setItem(STORAGE_KEY, language);
    } catch {
      // Storage failure must not prevent a backend bundle from becoming active.
    }
  }

  private assertLanguagesResponse(response: I18nLanguagesDto): void {
    if (!response.languages.some((item) => item.code === response.defaultLanguage)) {
      throw new Error(`Unsupported default language: ${response.defaultLanguage}`);
    }
  }

  private storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}

function interpolate(template: string, params?: I18nParams): string {
  if (params === undefined) return template;
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
