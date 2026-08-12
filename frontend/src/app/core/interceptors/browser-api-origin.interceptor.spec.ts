import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
  withNoXsrfProtection,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { browserApiOriginInterceptor } from './browser-api-origin.interceptor';

describe('browserApiOriginInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  afterEach(() => httpMock.verify());

  it('normalizes browser API requests to the page public origin', () => {
    configure();

    http.get('/api/i18n/languages').subscribe();

    httpMock.expectOne('https://site.example/api/i18n/languages').flush({});
  });

  it('does not rewrite non-API browser URLs', () => {
    configure();

    http.get('/assets/logo.svg').subscribe();

    httpMock.expectOne('/assets/logo.svg').flush('');
  });

  function configure(): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withNoXsrfProtection(), withInterceptors([browserApiOriginInterceptor])),
        provideHttpClientTesting(),
        { provide: DOCUMENT, useValue: { location: { origin: 'https://site.example' } } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }
});
