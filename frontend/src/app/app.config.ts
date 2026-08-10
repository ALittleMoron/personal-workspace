import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
  InjectionToken,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';
import { browserApiOriginInterceptor } from './core/interceptors/browser-api-origin.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { GlobalErrorHandler } from './core/error/global-error-handler';
import { I18nService } from './core/i18n/i18n.service';
import { of } from 'rxjs';
import { LocalizedTitleStrategy } from './core/seo/localized-title.strategy';

export const SKIP_I18N_STARTUP = new InjectionToken<boolean>('SKIP_I18N_STARTUP', {
  providedIn: 'root',
  factory: () => false,
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([errorInterceptor, browserApiOriginInterceptor])),
    provideAppInitializer(() => initializeI18n()),
    { provide: TitleStrategy, useClass: LocalizedTitleStrategy },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};

function initializeI18n() {
  if (inject(SKIP_I18N_STARTUP)) {
    return of(void 0);
  }
  return inject(I18nService).initialize();
}
