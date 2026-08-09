import { TestBed } from '@angular/core/testing';
import { I18nService } from '../i18n/i18n.service';
import { NotificationService } from '../notifications/notification.service';
import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  it('turns uncaught failures into generic localized feedback', () => {
    const error = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: I18nService, useValue: { translate: () => 'Something went wrong.' } },
        { provide: NotificationService, useValue: { error } },
      ],
    });

    TestBed.inject(GlobalErrorHandler).handleError(new Error('private detail'));

    expect(error).toHaveBeenCalledWith('Something went wrong.');
  });
});
