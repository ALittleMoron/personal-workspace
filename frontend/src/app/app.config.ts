import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GlobalErrorHandler } from './core/error/global-error-handler';
import { I18nService } from './core/i18n/i18n.service';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { ThemeService } from './core/layout/theme.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAppInitializer(() => {
      inject(ThemeService);
      return firstValueFrom(inject(I18nService).initialize());
    }),
  ],
};
