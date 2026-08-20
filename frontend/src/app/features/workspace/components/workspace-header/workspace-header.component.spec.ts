import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { I18nLanguage, LanguageCode } from '../../../../core/i18n/i18n.model';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ThemeName, ThemeService } from '../../../../core/layout/theme.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { WorkspaceHeaderComponent } from './workspace-header.component';

describe('WorkspaceHeaderComponent', () => {
  let fixture: ComponentFixture<WorkspaceHeaderComponent>;
  let language: ReturnType<typeof signal<LanguageCode | null>>;
  let theme: ReturnType<typeof signal<ThemeName>>;
  let logout: jest.Mock;
  let confirmDiscard: jest.Mock;
  let discardChanges: jest.Mock;
  let notifications: { error: jest.Mock };
  let navigateByUrl: jest.SpyInstance;

  beforeEach(async () => {
    language = signal<LanguageCode | null>('ru');
    theme = signal<ThemeName>('light');
    logout = jest.fn();
    confirmDiscard = jest.fn(() => true);
    discardChanges = jest.fn();
    notifications = { error: jest.fn() };
    const languages = signal<I18nLanguage[]>([
      { code: 'ru', label: 'Русский' },
      { code: 'en', label: 'English' },
    ]);
    const messages: Record<string, string> = {
      'workspace.title': 'Рабочее пространство',
      'shell.theme.dark': 'Dark',
      'shell.theme.light': 'Light',
      'shell.theme.toggle': 'Переключить тему',
      'shell.language.label': 'Язык',
      'auth.currentUser': 'Текущий пользователь',
      'auth.logout': 'Выйти',
      'auth.logout.submitting': 'Выходим',
      'auth.logout.failed': 'Не удалось выйти',
    };

    await TestBed.configureTestingModule({
      imports: [WorkspaceHeaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: I18nService,
          useValue: {
            language,
            languages,
            translate: (key: string) => messages[key] ?? key,
            switchLanguage: (nextLanguage: LanguageCode) => {
              language.set(nextLanguage);
              return of(void 0);
            },
          },
        },
        {
          provide: AuthSessionService,
          useValue: {
            state: signal({ status: 'authenticated', user: { username: 'owner' } }),
            logout,
          },
        },
        { provide: UnsavedChangesService, useValue: { confirmDiscard, discardChanges } },
        { provide: NotificationService, useValue: notifications },
        {
          provide: ThemeService,
          useValue: {
            theme,
            toggleTheme: () => theme.update((value) => (value === 'light' ? 'dark' : 'light')),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceHeaderComponent);
    fixture.detectChanges();
    navigateByUrl = jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  it('keeps the workspace header focused on its title without a public-home exit', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="workspace-home-link"]')).toBeNull();
    expect(element.querySelector('[data-testid="workspace-header-title"]')?.textContent).toContain(
      'Рабочее пространство',
    );
  });

  it('shows the workspace logo beside the title without repeating its accessible name', () => {
    const logo = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>(
      '[data-testid="workspace-logo"]',
    );

    expect(logo?.getAttribute('src')).toBe('/brand/archive-portal-64.png');
    expect(logo?.getAttribute('alt')).toBe('');
  });

  it('shows the target theme in a menu item and keeps the account menu open after switching', () => {
    const accountMenu = element<HTMLElement>('[data-testid="workspace-account-menu"]');
    const accountTrigger = element<HTMLButtonElement>(
      '[data-testid="workspace-account-menu-toggle"]',
    );
    const themeButton = element<HTMLButtonElement>('button[aria-label="Переключить тему"]');

    dispatchToggle(accountMenu, 'open');
    fixture.detectChanges();

    expect(themeButton.textContent).toContain('Переключить тему');
    expect(themeButton.textContent).toContain('Dark');

    themeButton.click();
    fixture.detectChanges();

    expect(themeButton.textContent).toContain('Light');
    expect(accountTrigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('expands the language choices inside the account menu and keeps them open after selection', () => {
    const accountMenu = element<HTMLElement>('[data-testid="workspace-account-menu"]');
    const languageToggle = buttonWithText('Язык');

    dispatchToggle(accountMenu, 'open');
    fixture.detectChanges();
    expect(languageToggle.getAttribute('aria-expanded')).toBe('false');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="workspace-account-language-options"]',
      ),
    ).toBeNull();

    languageToggle.click();
    fixture.detectChanges();

    const languageOptions = element<HTMLElement>(
      '[data-testid="workspace-account-language-options"]',
    );
    const russianButton = buttonWithText('RU');
    const englishButton = buttonWithText('EN');

    expect(languageToggle.getAttribute('aria-expanded')).toBe('true');
    expect(languageOptions.contains(russianButton)).toBe(true);
    expect(languageOptions.contains(englishButton)).toBe(true);
    expect(russianButton.getAttribute('aria-pressed')).toBe('true');
    expect(englishButton.getAttribute('aria-pressed')).toBe('false');

    englishButton.click();
    fixture.detectChanges();

    expect(language()).toBe('en');
    expect(englishButton.getAttribute('aria-pressed')).toBe('true');
    expect(languageToggle.getAttribute('aria-expanded')).toBe('true');
    expect(
      element<HTMLButtonElement>('[data-testid="workspace-account-menu-toggle"]').getAttribute(
        'aria-expanded',
      ),
    ).toBe('true');
  });

  it('uses the username as an accessible popover trigger', () => {
    const trigger = element<HTMLButtonElement>('[data-testid="workspace-account-menu-toggle"]');
    const menu = element<HTMLElement>('[data-testid="workspace-account-menu"]');

    expect(trigger.textContent?.trim()).toBe('owner');
    expect(trigger.getAttribute('title')).toBe('owner');
    expect(trigger.getAttribute('popovertarget')).toBe(menu.id);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="workspace-current-user"]',
      ),
    ).toBeNull();

    dispatchToggle(menu, 'open');
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    dispatchToggle(menu, 'closed');
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the account menu on viewport changes and resets the language choices', () => {
    const trigger = element<HTMLButtonElement>('[data-testid="workspace-account-menu-toggle"]');
    const menu = element<HTMLElement>('[data-testid="workspace-account-menu"]');
    const hidePopover = jest.fn<void, []>();
    Object.defineProperty(menu, 'hidePopover', { configurable: true, value: hidePopover });
    dispatchToggle(menu, 'open');
    fixture.detectChanges();
    buttonWithText('Язык').click();
    fixture.detectChanges();

    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();

    expect(hidePopover).toHaveBeenCalledTimes(1);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="workspace-account-language-options"]',
      ),
    ).toBeNull();
  });

  it('keeps the workspace intact when logout is cancelled before the request', () => {
    confirmDiscard.mockReturnValueOnce(false);
    buttonWithText('Выйти').click();

    expect(logout).not.toHaveBeenCalled();
    expect(discardChanges).not.toHaveBeenCalled();
  });

  it('suppresses duplicate logout and delays baseline commit and navigation until success', () => {
    const response = new Subject<void>();
    logout.mockReturnValueOnce(response);
    const logoutButton = element<HTMLButtonElement>('[data-testid="workspace-account-logout"]');

    expect(logoutButton.getAttribute('aria-busy')).toBe('false');
    logoutButton.click();
    fixture.detectChanges();
    buttonWithText('Выходим').click();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(confirmDiscard).toHaveBeenCalledTimes(1);
    expect(discardChanges).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(buttonWithText('Выходим').disabled).toBe(true);
    expect(logoutButton.getAttribute('aria-busy')).toBe('true');

    response.next();
    response.complete();
    fixture.detectChanges();

    expect(discardChanges).toHaveBeenCalledTimes(1);
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
    expect(buttonWithText('Выйти').disabled).toBe(false);
    expect(logoutButton.getAttribute('aria-busy')).toBe('false');
  });

  it('keeps baselines and navigation intact and clears busy state after logout failure', () => {
    const response = new Subject<void>();
    logout.mockReturnValueOnce(response);

    buttonWithText('Выйти').click();
    response.error(new Error('network'));
    fixture.detectChanges();

    expect(discardChanges).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(notifications.error).toHaveBeenCalledWith('Не удалось выйти');
    expect(buttonWithText('Выйти').disabled).toBe(false);
  });

  function buttonWithText(text: string): HTMLButtonElement {
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((item) => item.textContent?.trim() === text);
    if (button === undefined) {
      throw new Error(`Missing ${text} button.`);
    }
    return button;
  }

  function element<T extends Element>(selector: string): T {
    const value = (fixture.nativeElement as HTMLElement).querySelector<T>(selector);
    if (value === null) {
      throw new Error(`Missing element: ${selector}`);
    }
    return value;
  }
});

function dispatchToggle(menu: HTMLElement, newState: 'open' | 'closed'): void {
  const event = new Event('toggle');
  Object.defineProperty(event, 'newState', { value: newState });
  menu.dispatchEvent(event);
}
