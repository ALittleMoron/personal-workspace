import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, of } from 'rxjs';
import { routes } from './app.routes';
import { AuthState } from './core/auth/auth.model';
import { AuthSessionService } from './core/auth/auth-session.service';
import { LanguageCode } from './core/i18n/i18n.model';
import { I18nService } from './core/i18n/i18n.service';
import { LocalizedTitleStrategy } from './core/routing/localized-title.strategy';
import { NotFoundPageComponent } from './features/not-found/pages/not-found-page/not-found-page.component';
import { SiteCaseStudyPageComponent } from './features/site-case-study/pages/site-case-study-page/site-case-study-page.component';
import { UpdatesPageComponent } from './features/updates/pages/updates-page/updates-page.component';
import { createI18nTestingValue } from './testing/i18n-testing';
import { CalendarService } from './features/admin-panel/services/calendar.service';
import { AdminToolsService } from './features/admin-panel/services/admin-tools.service';

describe('application routes', () => {
  let language: WritableSignal<LanguageCode | null>;
  let router: Router;
  let title: Title;
  let originalTitle: string;
  let authState: WritableSignal<AuthState>;

  beforeEach(() => {
    originalTitle = document.title;
    const i18n = createI18nTestingValue();
    authState = signal<AuthState>({ status: 'anonymous', user: null });
    language = i18n.language as WritableSignal<LanguageCode | null>;
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: I18nService, useValue: i18n },
        { provide: TitleStrategy, useClass: LocalizedTitleStrategy },
        {
          provide: AuthSessionService,
          useValue: {
            state: authState,
            restore: jest.fn(() => of(authState())),
          },
        },
        { provide: CalendarService, useValue: { getCalendar: () => NEVER } },
        { provide: AdminToolsService, useValue: { getCacheStatus: () => NEVER } },
      ],
    });
    router = TestBed.inject(Router);
    title = TestBed.inject(Title);
  });

  afterEach(() => title.setTitle(originalTitle));

  it('sends an anonymous browser root to the lazy login contour', async () => {
    await RouterTestingHarness.create();

    await router.navigateByUrl('/');

    expect(router.url).toBe('/login');
  });

  it('sends an authenticated browser root to the workspace dashboard', async () => {
    authState.set({ status: 'authenticated', user: { username: 'owner' } });
    await RouterTestingHarness.create();

    await router.navigateByUrl('/');

    expect(router.url).toBe('/admin-panel/dashboard');
  });

  it('sends an anonymous admin route to login with its safe return URL', async () => {
    await RouterTestingHarness.create();

    await router.navigateByUrl('/admin-panel/knowledge/people');

    expect(router.url).toBe('/login?returnUrl=%2Fadmin-panel%2Fknowledge%2Fpeople');
  });

  it('sends an authenticated login route to the workspace dashboard', async () => {
    authState.set({ status: 'authenticated', user: { username: 'owner' } });
    await RouterTestingHarness.create();

    await router.navigateByUrl('/login');

    expect(router.url).toBe('/admin-panel/dashboard');
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

  it('keeps the direct site case-study route public', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/how-this-site-is-built', SiteCaseStudyPageComponent);

    expect(router.url).toBe('/how-this-site-is-built');
  });

  it('keeps the explicit not-found route reachable', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/404', NotFoundPageComponent);

    expect(router.url).toBe('/404');
  });
});
