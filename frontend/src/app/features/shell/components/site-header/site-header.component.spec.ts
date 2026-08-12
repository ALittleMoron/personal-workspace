import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { I18nLanguage, LanguageCode } from '../../../../core/i18n/i18n.model';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ThemeName, ThemeService } from '../../../../core/layout/theme.service';
import { SiteHeaderComponent } from './site-header.component';

@Component({ standalone: true, template: '' })
class EmptyRouteComponent {}

describe('SiteHeaderComponent', () => {
  let fixture: ComponentFixture<SiteHeaderComponent>;
  let router: Router;
  let language: ReturnType<typeof signal<LanguageCode | null>>;

  beforeEach(async () => {
    language = signal<LanguageCode | null>('ru');
    const languages = signal<I18nLanguage[]>([
      { code: 'ru', label: 'Русский' },
      { code: 'en', label: 'English' },
    ]);
    const theme = signal<ThemeName>('light');
    const messages: Record<string, string> = {
      'shell.nav.toggleNavigation': 'Открыть навигацию',
      'shell.theme.dark': 'Dark',
      'shell.theme.light': 'Light',
      'shell.theme.toggle': 'Переключить тему',
      'shell.language.label': 'Язык',
    };

    await TestBed.configureTestingModule({
      imports: [SiteHeaderComponent],
      providers: [
        provideRouter([{ path: '**', component: EmptyRouteComponent }]),
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

    router = TestBed.inject(Router);
    await router.navigateByUrl('/ru/updates?from=header#latest');
    fixture = TestBed.createComponent(SiteHeaderComponent);
    fixture.detectChanges();
  });

  it('uses the localized public home and exposes a stateful mobile navigation control', () => {
    const element = fixture.nativeElement as HTMLElement;
    const brand = element.querySelector('.navbar-brand') as HTMLAnchorElement | null;
    const toggle = element.querySelector('.navbar-toggler') as HTMLButtonElement | null;

    expect(brand?.getAttribute('href')).toBe('/ru/how-this-site-is-built');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');

    toggle?.click();
    fixture.detectChanges();
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');

    brand?.click();
    fixture.detectChanges();
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
  });

  it('reflects a theme change in its visible control label', () => {
    const themeButton = buttonWithText('Dark');

    themeButton.click();
    fixture.detectChanges();

    expect(themeButton.textContent?.trim()).toBe('Light');
  });

  it('rewrites the current localized public URL after a successful language switch', async () => {
    const englishButton = buttonWithText('EN');

    englishButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/en/updates?from=header#latest');
    expect(language()).toBe('en');
    expect(englishButton.getAttribute('aria-pressed')).toBe('true');
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
