import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, Component, signal, WritableSignal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { of } from 'rxjs';
import { appConfig } from './app.config';
import { AuthOverlayService } from './core/auth/auth-overlay.service';
import { AuthState } from './core/auth/auth.model';
import { AuthSessionService } from './core/auth/auth-session.service';
import { I18nService } from './core/i18n/i18n.service';

@Component({ selector: 'app-config-test-host', standalone: true, template: '' })
class AppConfigTestHostComponent {}

describe('appConfig', () => {
  let application: ApplicationRef | null;
  let httpMock: HttpTestingController | null;
  let originalBody: string;

  beforeEach(() => {
    application = null;
    httpMock = null;
    originalBody = document.body.innerHTML;
    document.body.innerHTML = '<app-config-test-host></app-config-test-host>';
  });

  afterEach(() => {
    httpMock?.verify();
    application?.destroy();
    document.body.innerHTML = originalBody;
  });

  it('initializes localization while bootstrapping the browser application', async () => {
    const initialize = jest.fn(() => of(void 0));
    application = await bootstrapApplication(AppConfigTestHostComponent, {
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

    expect(initialize).toHaveBeenCalledTimes(1);
  });

  it('recovers from a raw protected 401 before mapping the caller error', async () => {
    const configured = await bootstrapConfiguredHttp();
    let failure: unknown;

    configured.http.get('/api/knowledge/people').subscribe({
      error: (error: unknown) => (failure = error),
    });

    configured.httpMock
      .expectOne((request) => request.url.endsWith('/api/knowledge/people'))
      .flush(
        {
          code: 'not_authenticated',
          type: 'unauthorized',
          message: 'Authentication is required.',
        },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(configured.authState()).toEqual({ status: 'anonymous', user: null });
    expect(configured.overlay.loginRequired()).toBe(true);
    expect(failure).toEqual({
      code: 'not_authenticated',
      type: 'unauthorized',
      message: 'Authentication is required.',
      status: 401,
      location: null,
      attr: null,
      nested_errors: undefined,
    });
  });

  it.each([403, 429])(
    'keeps a configured-chain %i response distinct without auth recovery',
    async (status) => {
      const configured = await bootstrapConfiguredHttp();
      let failure: unknown;

      configured.http.get('/api/knowledge/people').subscribe({
        error: (error: unknown) => (failure = error),
      });

      configured.httpMock
        .expectOne((request) => request.url.endsWith('/api/knowledge/people'))
        .flush(
          {
            code: 'request_failed',
            type: 'request_error',
            message: 'The request failed.',
          },
          { status, statusText: 'Request failed' },
        );

      expect(failure).toEqual({
        code: 'request_failed',
        type: 'request_error',
        message: 'The request failed.',
        status,
        location: null,
        attr: null,
        nested_errors: undefined,
      });
      expect(configured.authState()).toEqual({
        status: 'authenticated',
        user: { username: 'owner' },
      });
      expect(configured.overlay.loginRequired()).toBe(false);
    },
  );

  async function bootstrapConfiguredHttp(): Promise<{
    http: HttpClient;
    httpMock: HttpTestingController;
    authState: WritableSignal<AuthState>;
    overlay: AuthOverlayService;
  }> {
    const authState = signal<AuthState>({
      status: 'authenticated',
      user: { username: 'owner' },
    });
    application = await bootstrapApplication(AppConfigTestHostComponent, {
      providers: [
        ...appConfig.providers,
        provideRouter([], withDisabledInitialNavigation()),
        provideHttpClientTesting(),
        {
          provide: I18nService,
          useValue: {
            initialize: jest.fn(() => of(void 0)),
            language: signal<'ru' | 'en'>('ru'),
            translate: (key: string) => key,
          },
        },
        {
          provide: AuthSessionService,
          useValue: {
            state: authState,
            clear: (): void => authState.set({ status: 'anonymous', user: null }),
          },
        },
      ],
    });
    const configuredHttpMock = application.injector.get(HttpTestingController);
    httpMock = configuredHttpMock;
    return {
      http: application.injector.get(HttpClient),
      httpMock: configuredHttpMock,
      authState,
      overlay: application.injector.get(AuthOverlayService),
    };
  }
});
