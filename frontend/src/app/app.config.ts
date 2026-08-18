import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';
import { browserApiOriginInterceptor } from './core/interceptors/browser-api-origin.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { authRecoveryInterceptor } from './core/interceptors/auth.interceptor';
import { GlobalErrorHandler } from './core/error/global-error-handler';
import { I18nService } from './core/i18n/i18n.service';
import { LocalizedTitleStrategy } from './core/routing/localized-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
      withInterceptors([errorInterceptor, authRecoveryInterceptor, browserApiOriginInterceptor]),
    ),
    provideAppInitializer(() => initializeI18n()),
    { provide: TitleStrategy, useClass: LocalizedTitleStrategy },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};

function initializeI18n() {
  return inject(I18nService).initialize();
}
