import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiClient } from '../http/api-client.service';
import { I18nLanguagesDto } from './i18n.model';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let httpMock: HttpTestingController;
  let document: Document;

  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    TestBed.configureTestingModule({
      providers: [ApiClient, I18nService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(I18nService);
    httpMock = TestBed.inject(HttpTestingController);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('loads the URL-selected supported bundle after discovering available languages', () => {
    window.history.replaceState({}, '', '/en/updates');

    service.initialize().subscribe();

    const languages = httpMock.expectOne((request) => request.url.endsWith('/api/i18n/languages'));
    expect(languages.request.method).toBe('GET');
    languages.flush(languagesDto());

    const bundle = httpMock.expectOne((request) => request.url.endsWith('/api/i18n/bundles/en'));
    bundle.flush({ language: 'en', messages: { greeting: 'Hello, {name}' } });

    expect(service.language()).toBe('en');
    expect(service.translate('greeting', { name: 'Dmitry' })).toBe('Hello, Dmitry');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('chosenLanguage')).toBe('en');
  });

  it('reuses a previously loaded language bundle when switching back', () => {
    service.initialize().subscribe();
    httpMock
      .expectOne((request) => request.url.endsWith('/api/i18n/languages'))
      .flush(languagesDto());
    httpMock
      .expectOne((request) => request.url.endsWith('/api/i18n/bundles/ru'))
      .flush({ language: 'ru', messages: { title: 'Заголовок' } });

    service.switchLanguage('en').subscribe();
    httpMock
      .expectOne((request) => request.url.endsWith('/api/i18n/bundles/en'))
      .flush({ language: 'en', messages: { title: 'Title' } });

    service.switchLanguage('ru').subscribe();

    httpMock.expectNone((request) => request.url.endsWith('/api/i18n/bundles/ru'));
    expect(service.language()).toBe('ru');
    expect(service.translate('title')).toBe('Заголовок');
  });

  it('reports a recoverable startup error when language discovery fails', () => {
    service.initialize().subscribe();
    httpMock
      .expectOne((request) => request.url.endsWith('/api/i18n/languages'))
      .flush({ detail: 'unavailable' }, { status: 503, statusText: 'Service Unavailable' });

    expect(service.startupError()).toBe(true);
    expect(service.translate('i18n.startupError.retry')).toBe('Retry');
  });
});

function languagesDto(): I18nLanguagesDto {
  return {
    defaultLanguage: 'ru',
    languages: [
      { code: 'ru', label: 'Русский' },
      { code: 'en', label: 'English' },
    ],
  };
}
