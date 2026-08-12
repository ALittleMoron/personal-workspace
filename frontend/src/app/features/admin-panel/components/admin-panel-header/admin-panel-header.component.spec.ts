import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { I18nLanguage, LanguageCode } from '../../../../core/i18n/i18n.model';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ThemeName, ThemeService } from '../../../../core/layout/theme.service';
import { AdminPanelHeaderComponent } from './admin-panel-header.component';

describe('AdminPanelHeaderComponent', () => {
  let fixture: ComponentFixture<AdminPanelHeaderComponent>;
  let language: ReturnType<typeof signal<LanguageCode | null>>;
  let theme: ReturnType<typeof signal<ThemeName>>;

  beforeEach(async () => {
    language = signal<LanguageCode | null>('ru');
    theme = signal<ThemeName>('light');
    const languages = signal<I18nLanguage[]>([
      { code: 'ru', label: 'Русский' },
      { code: 'en', label: 'English' },
    ]);
    const messages: Record<string, string> = {
      'adminPanel.title': 'Админ-панель',
      'adminPanel.header.backToHome': 'На главную',
      'shell.theme.dark': 'Dark',
      'shell.theme.light': 'Light',
      'shell.theme.toggle': 'Переключить тему',
      'shell.language.label': 'Язык',
    };

    await TestBed.configureTestingModule({
      imports: [AdminPanelHeaderComponent],
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
          provide: ThemeService,
          useValue: {
            theme,
            toggleTheme: () => theme.update((value) => (value === 'light' ? 'dark' : 'light')),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPanelHeaderComponent);
    fixture.detectChanges();
  });

  it('links the icon-only back control to the localized public home', () => {
    const element = fixture.nativeElement as HTMLElement;
    const homeLink = element.querySelector(
      '[data-testid="admin-panel-home-link"]',
    ) as HTMLAnchorElement | null;

    expect(homeLink?.getAttribute('href')).toBe('/ru/how-this-site-is-built');
    expect(homeLink?.getAttribute('aria-label')).toBe('На главную');
    expect(homeLink?.textContent?.trim()).toBe('');
    expect(
      element.querySelector('[data-testid="admin-panel-header-title"]')?.textContent,
    ).toContain('Админ-панель');
  });

  it('reflects theme changes in the header control label', () => {
    const themeButton = buttonWithText('Dark');

    themeButton.click();
    fixture.detectChanges();

    expect(themeButton.textContent?.trim()).toBe('Light');
  });

  it('switches the active language and updates the public-home destination', () => {
    const englishButton = buttonWithText('EN');

    englishButton.click();
    fixture.detectChanges();

    expect(language()).toBe('en');
    expect(englishButton.getAttribute('aria-pressed')).toBe('true');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('[data-testid="admin-panel-home-link"]')
        ?.getAttribute('href'),
    ).toBe('/en/how-this-site-is-built');
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
});
