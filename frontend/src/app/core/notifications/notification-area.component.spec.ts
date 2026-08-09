import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideI18nTesting } from '../../testing/i18n-testing';
import { NotificationAreaComponent } from './notification-area.component';
import { NotificationService } from './notification.service';

describe('NotificationAreaComponent', () => {
  let fixture: ComponentFixture<NotificationAreaComponent>;
  let dismiss: jest.Mock;

  beforeEach(async () => {
    dismiss = jest.fn();
    await TestBed.configureTestingModule({
      imports: [NotificationAreaComponent],
      providers: [
        provideI18nTesting(),
        {
          provide: NotificationService,
          useValue: {
            notifications: signal([
              { id: 1, type: 'success', message: 'Saved' },
              { id: 2, type: 'danger', message: 'Failed', dismissing: true },
            ]),
            dismiss,
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NotificationAreaComponent);
    fixture.detectChanges();
  });

  it('renders transient notifications and dismisses them', () => {
    const alerts = fixture.nativeElement.querySelectorAll('[role="alert"]');
    expect(alerts).toHaveLength(2);
    expect(alerts[0].textContent).toContain('Saved');
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(dismiss).toHaveBeenCalledWith(1);
  });
});
