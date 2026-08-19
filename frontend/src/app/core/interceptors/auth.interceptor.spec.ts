import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthOverlayService } from '../auth/auth-overlay.service';
import { AuthState } from '../auth/auth.model';
import { SKIP_AUTH_RECOVERY } from '../auth/auth-http-context';
import { AuthSessionService } from '../auth/auth-session.service';
import { authRecoveryInterceptor } from './auth.interceptor';

describe('authRecoveryInterceptor', () => {
  let authState = signal<AuthState>({ status: 'authenticated', user: { username: 'owner' } });
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let overlay: AuthOverlayService;

  beforeEach(() => {
    authState = signal<AuthState>({ status: 'authenticated', user: { username: 'owner' } });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authRecoveryInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthSessionService,
          useValue: {
            state: authState,
            clear: (): void => authState.set({ status: 'anonymous', user: null }),
          },
        },
        AuthOverlayService,
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    overlay = TestBed.inject(AuthOverlayService);
  });

  afterEach(() => httpMock.verify());

  it('opens login recovery after one raw 401 from a protected API request without retrying it', () => {
    let failure: unknown;

    http.post('/api/knowledge/people', { name: 'Ada' }).subscribe({
      error: (error: unknown) => (failure = error),
    });

    const request = httpMock.expectOne('/api/knowledge/people');
    request.flush({ code: 'not_authenticated' }, { status: 401, statusText: 'Unauthorized' });

    expect(failure).toBeInstanceOf(HttpErrorResponse);
    expect(authState()).toEqual({ status: 'anonymous', user: null });
    expect(overlay.loginRequired()).toBe(true);
    httpMock.expectNone('/api/knowledge/people');
  });

  it('does not open recovery for a marked authentication request', () => {
    let failure: unknown;

    http
      .get('/api/auth/session', { context: new HttpContext().set(SKIP_AUTH_RECOVERY, true) })
      .subscribe({ error: (error: unknown) => (failure = error) });

    httpMock
      .expectOne('/api/auth/session')
      .flush({ code: 'not_authenticated' }, { status: 401, statusText: 'Unauthorized' });

    expect(failure).toBeInstanceOf(HttpErrorResponse);
    expect(authState()).toEqual({ status: 'authenticated', user: { username: 'owner' } });
    expect(overlay.loginRequired()).toBe(false);
  });

  it.each([403, 429])('preserves a %i protected API error without recovery', (status) => {
    let failure: unknown;

    http.get('/api/knowledge/people').subscribe({
      error: (error: unknown) => (failure = error),
    });

    httpMock
      .expectOne('/api/knowledge/people')
      .flush({ code: 'request_failed' }, { status, statusText: 'Request failed' });

    expect(failure).toBeInstanceOf(HttpErrorResponse);
    expect((failure as HttpErrorResponse).status).toBe(status);
    expect(authState()).toEqual({ status: 'authenticated', user: { username: 'owner' } });
    expect(overlay.loginRequired()).toBe(false);
  });

  it.each([
    '/api/tools/cache',
    '/api/calendar',
    '/api/files/file-1',
    '/api/resumes/resume-1',
    '/api/knowledge/people',
    '/api/wiki-links/targets',
    'https://workspace.example.test/api/calendar?window=month#current',
  ])('opens recovery for canonical protected API request %s', (url) => {
    http.get(url).subscribe({ error: () => undefined });

    httpMock.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authState()).toEqual({ status: 'anonymous', user: null });
    expect(overlay.loginRequired()).toBe(true);
  });

  it.each([
    '/api/admin/knowledge/people',
    '/api/toolbox/cache',
    '/api/administrator/knowledge/people',
    '/api/auth/session',
    '/api/healthz',
    '/api/i18n/languages',
    '/api/knowledge-base/people',
    'https://external.example.test/?returnUrl=/api/knowledge/people',
    'https://external.example.test/#/api/knowledge/people',
  ])('does not open recovery for a non-protected API 401 at %s', (url) => {
    http.get(url).subscribe({ error: () => undefined });

    httpMock.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authState()).toEqual({ status: 'authenticated', user: { username: 'owner' } });
    expect(overlay.loginRequired()).toBe(false);
  });
});
