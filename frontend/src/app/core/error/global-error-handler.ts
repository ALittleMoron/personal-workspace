import { ErrorHandler, Injectable, inject, isDevMode } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly i18n = inject(I18nService);
  private readonly notifications = inject(NotificationService);

  handleError(error: unknown): void {
    if (isDevMode()) console.error('[PersonalWorkspace]', error);
    this.notifications.error(this.i18n.translate('error.generic'));
  }
}
