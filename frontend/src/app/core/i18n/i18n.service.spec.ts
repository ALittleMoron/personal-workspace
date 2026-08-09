import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(I18nService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('loads backend-owned languages and the default bundle', () => {
    service.initialize().subscribe();
    httpMock.expectOne('/api/i18n/languages').flush({
      defaultLanguage: 'ru',
      languages: [
        { code: 'ru', label: 'Русский' },
        { code: 'en', label: 'English' },
      ],
    });
    httpMock.expectOne('/api/i18n/bundles/ru').flush({
      language: 'ru',
      messages: { 'app.name': 'Персональное рабочее пространство' },
    });

    expect(service.startupState()).toBe('ready');
    expect(service.language()).toBe('ru');
    expect(service.translate('app.name')).toBe('Персональное рабочее пространство');
    expect(document.documentElement.lang).toBe('ru');
  });

  it('keeps a stable retryable state when startup fails', () => {
    service.initialize().subscribe();
    httpMock
      .expectOne('/api/i18n/languages')
      .flush({}, { status: 503, statusText: 'Unavailable' });

    expect(service.startupState()).toBe('error');
    expect(service.translate('shared.retry')).toBe('Retry');
  });

  it('uses the explicit Russian bootstrap catalog before the backend bundle is available', () => {
    localStorage.setItem('chosenLanguage', 'ru');
    service.initialize().subscribe();
    httpMock
      .expectOne('/api/i18n/languages')
      .flush({}, { status: 503, statusText: 'Unavailable' });

    expect(service.translate('error.generic')).toBe(
      'Не удалось загрузить текст интерфейса.',
    );
    expect(service.translate('shared.retry')).toBe('Повторить');
    expect(document.documentElement.lang).toBe('ru');
  });

  it('uses only a stored language that the backend reports as supported', () => {
    localStorage.setItem('chosenLanguage', 'en');
    service.initialize().subscribe();
    httpMock.expectOne('/api/i18n/languages').flush({
      defaultLanguage: 'ru',
      languages: [
        { code: 'ru', label: 'Русский' },
        { code: 'en', label: 'English' },
      ],
    });
    httpMock.expectOne('/api/i18n/bundles/en').flush({
      language: 'en',
      messages: { 'app.name': 'Personal Workspace' },
    });

    expect(service.language()).toBe('en');
  });

  it('activates the default bundle when localStorage reads and writes throw', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('read blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('write blocked');
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(I18nService);
    httpMock = TestBed.inject(HttpTestingController);

    service.initialize().subscribe();
    httpMock.expectOne('/api/i18n/languages').flush({
      defaultLanguage: 'ru',
      languages: [{ code: 'ru', label: 'Русский' }],
    });
    httpMock.expectOne('/api/i18n/bundles/ru').flush({
      language: 'ru',
      messages: { 'app.name': 'Персональное рабочее пространство' },
    });

    expect(service.startupState()).toBe('ready');
    expect(service.language()).toBe('ru');
    expect(document.documentElement.lang).toBe('ru');
  });

  it('activates the default bundle when acquiring localStorage throws', () => {
    TestBed.resetTestingModule();
    const defaultView = Object.defineProperty({}, 'localStorage', {
      get: () => {
        throw new Error('storage access blocked');
      },
    });
    const serverDocument = { defaultView, documentElement: { lang: '' } };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DOCUMENT, useValue: serverDocument },
      ],
    });
    service = TestBed.inject(I18nService);
    httpMock = TestBed.inject(HttpTestingController);

    service.initialize().subscribe();
    httpMock.expectOne('/api/i18n/languages').flush({
      defaultLanguage: 'en',
      languages: [{ code: 'en', label: 'English' }],
    });
    httpMock.expectOne('/api/i18n/bundles/en').flush({
      language: 'en',
      messages: { 'app.name': 'Personal Workspace' },
    });

    expect(service.startupState()).toBe('ready');
    expect(service.language()).toBe('en');
    expect(serverDocument.documentElement.lang).toBe('en');
  });
});
