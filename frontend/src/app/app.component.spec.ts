import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { I18nService } from './core/i18n/i18n.service';
import { ThemeService } from './core/layout/theme.service';
import { NotificationService } from './core/notifications/notification.service';

describe('AppComponent', () => {
  it('renders a stable retry state when localization startup fails', async () => {
    const retryStartup = jest.fn(() => of(void 0));
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        {
          provide: I18nService,
          useValue: {
            startupState: signal('error'),
            language: signal(null),
            languages: signal([]),
            translate: (key: string): string =>
              ({ 'error.generic': 'Something went wrong.', 'shared.retry': 'Retry' })[key] ?? key,
            retryStartup,
            switchLanguage: () => of(void 0),
          },
        },
        {
          provide: ThemeService,
          useValue: { theme: signal('light'), toggleTheme: jest.fn() },
        },
        { provide: NotificationService, useValue: { notifications: signal([]), dismiss: jest.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('main [role="alert"]')).not.toBeNull();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(retryStartup).toHaveBeenCalledTimes(1);
  });

  it('exposes an accessible backend-localized theme toggle', async () => {
    const theme = signal<'light' | 'dark'>('light');
    const toggleTheme = jest.fn(() => theme.set(theme() === 'light' ? 'dark' : 'light'));
    const messages: Readonly<Record<string, string>> = {
      'language.label': 'Language',
      'theme.toggle': 'Toggle theme',
      'theme.light': 'Light theme',
      'theme.dark': 'Dark theme',
    };
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        {
          provide: I18nService,
          useValue: {
            startupState: signal('ready'),
            language: signal('en'),
            languages: signal([{ code: 'en', label: 'English' }]),
            translate: (key: string): string => messages[key] ?? key,
            retryStartup: () => of(void 0),
            switchLanguage: () => of(void 0),
          },
        },
        { provide: ThemeService, useValue: { theme, toggleTheme } },
        { provide: NotificationService, useValue: { notifications: signal([]), dismiss: jest.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      'button[aria-label="Toggle theme"]',
    ) as HTMLButtonElement;

    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.textContent).toContain('Light theme');
    button.click();
    fixture.detectChanges();
    expect(toggleTheme).toHaveBeenCalledTimes(1);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.textContent).toContain('Dark theme');
  });
});
