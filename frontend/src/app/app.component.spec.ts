import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { I18nService } from './core/i18n/i18n.service';
import { ThemeName, ThemeService } from './core/layout/theme.service';
import { createI18nTestingValue } from './testing/i18n-testing';

@Component({ standalone: true, template: '' })
class AdminRouteComponent {}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let startupError: ReturnType<typeof signal<boolean>>;
  let retryStartup: jest.Mock;

  beforeEach(async () => {
    startupError = signal(false);
    retryStartup = jest.fn(() => of(void 0));

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([{ path: 'admin-panel', component: AdminRouteComponent }]),
        {
          provide: I18nService,
          useValue: {
            ...createI18nTestingValue({
              'i18n.startupError.title': 'Localization is unavailable',
              'i18n.startupError.message': 'Try again when the API is available.',
              'i18n.startupError.retry': 'Retry localization',
            }),
            startupError,
            retryStartup,
          },
        },
        {
          provide: ThemeService,
          useValue: { theme: signal<ThemeName>('light'), toggleTheme: jest.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('renders the public shell around public routes', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-site-header')).not.toBeNull();
    expect(element.querySelector('app-site-footer')).not.toBeNull();
  });

  it('removes public chrome while an admin route is active', async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/admin-panel');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-site-header')).toBeNull();
    expect(element.querySelector('app-site-footer')).toBeNull();
  });

  it('shows a recoverable startup error and retries localization on request', () => {
    startupError.set(true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Localization is unavailable');
    expect(element.querySelector('app-site-header')).toBeNull();

    const retry = Array.from(element.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Retry localization',
    );
    if (retry === undefined) {
      throw new Error('Expected the localization retry control.');
    }

    retry.click();

    expect(retryStartup).toHaveBeenCalledTimes(1);
  });
});
