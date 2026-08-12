import { WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { LanguageCode } from './core/i18n/i18n.model';
import { I18nService } from './core/i18n/i18n.service';
import { LocalizedTitleStrategy } from './core/routing/localized-title.strategy';
import { NotFoundPageComponent } from './features/not-found/pages/not-found-page/not-found-page.component';
import { SiteCaseStudyPageComponent } from './features/site-case-study/pages/site-case-study-page/site-case-study-page.component';
import { UpdatesPageComponent } from './features/updates/pages/updates-page/updates-page.component';
import { createI18nTestingValue } from './testing/i18n-testing';

describe('application routes', () => {
  let language: WritableSignal<LanguageCode | null>;
  let router: Router;
  let title: Title;
  let originalTitle: string;

  beforeEach(() => {
    originalTitle = document.title;
    const i18n = createI18nTestingValue();
    language = i18n.language as WritableSignal<LanguageCode | null>;
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: I18nService, useValue: i18n },
        { provide: TitleStrategy, useClass: LocalizedTitleStrategy },
      ],
    });
    router = TestBed.inject(Router);
    title = TestBed.inject(Title);
  });

  afterEach(() => title.setTitle(originalTitle));

  it('opens the initialized-language public home from the browser root', async () => {
    language.set('en');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/', SiteCaseStudyPageComponent);

    expect(router.url).toBe('/en/how-this-site-is-built');
    expect(harness.routeNativeElement?.querySelector('h1')).not.toBeNull();
    expect(title.getTitle()).toBe('How this site is built');
  });

  it('navigates between localized public destinations with browser titles', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/ru/updates', UpdatesPageComponent);
    expect(router.url).toBe('/ru/updates');
    expect(title.getTitle()).toBe('Обновления');

    language.set('en');
    await harness.navigateByUrl('/en/how-this-site-is-built', SiteCaseStudyPageComponent);
    expect(router.url).toBe('/en/how-this-site-is-built');
    expect(title.getTitle()).toBe('How this site is built');
  });

  it('keeps the legacy public route and redirects an unknown browser path to not found', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/updates', UpdatesPageComponent);
    expect(router.url).toBe('/updates');

    await harness.navigateByUrl('/missing-page', NotFoundPageComponent);
    expect(router.url).toBe('/404');
    expect(harness.routeNativeElement?.querySelector('h1')).not.toBeNull();
  });
});
