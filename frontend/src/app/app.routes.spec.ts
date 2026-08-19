import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, of } from 'rxjs';
import { routes } from './app.routes';
import { AuthState } from './core/auth/auth.model';
import { AuthSessionService } from './core/auth/auth-session.service';
import { I18nService } from './core/i18n/i18n.service';
import { LocalizedTitleStrategy } from './core/routing/localized-title.strategy';
import { NotFoundPageComponent } from './features/not-found/pages/not-found-page/not-found-page.component';
import { createI18nTestingValue } from './testing/i18n-testing';
import { CalendarService } from './features/workspace/services/calendar.service';
import { ToolsService } from './features/workspace/services/tools.service';

describe('application routes', () => {
  let router: Router;
  let title: Title;
  let originalTitle: string;
  let authState: WritableSignal<AuthState>;

  beforeEach(() => {
    originalTitle = document.title;
    const i18n = createI18nTestingValue();
    authState = signal<AuthState>({ status: 'anonymous', user: null });
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
        { provide: ToolsService, useValue: { getCacheStatus: () => NEVER } },
      ],
    });
    router = TestBed.inject(Router);
    title = TestBed.inject(Title);
  });

  afterEach(() => title.setTitle(originalTitle));

  it('allows an anonymous visitor to open login', async () => {
    await RouterTestingHarness.create();

    await router.navigateByUrl('/login');

    expect(router.url).toBe('/login');
  });

  it('sends an anonymous browser root to login', async () => {
    await RouterTestingHarness.create();

    await router.navigateByUrl('/');

    expect(router.url).toBe('/login');
  });

  it('renders the authenticated workspace dashboard at the root without a redirect', async () => {
    authState.set({ status: 'authenticated', user: { username: 'owner' } });
    await RouterTestingHarness.create();

    await router.navigateByUrl('/');

    expect(router.url).toBe('/');
  });

  it('sends an anonymous workspace route to login with its safe return URL', async () => {
    await RouterTestingHarness.create();

    await router.navigateByUrl('/knowledge/people?filter=active');

    expect(router.url).toBe('/login?returnUrl=%2Fknowledge%2Fpeople%3Ffilter%3Dactive');
  });

  it('sends an authenticated login route to the workspace root', async () => {
    authState.set({ status: 'authenticated', user: { username: 'owner' } });
    await RouterTestingHarness.create();

    await router.navigateByUrl('/login');

    expect(router.url).toBe('/');
  });

  it.each(['/ru/updates', '/updates', '/how-this-site-is-built', '/missing-page'])(
    'sends an anonymous legacy public route %s to login without a return URL',
    async (url) => {
      await RouterTestingHarness.create();

      await router.navigateByUrl(url);

      expect(router.url).toBe('/login');
    },
  );

  it('keeps an authenticated unknown URL while showing not found', async () => {
    authState.set({ status: 'authenticated', user: { username: 'owner' } });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/missing-page', NotFoundPageComponent);
    expect(router.url).toBe('/missing-page');
    expect(harness.routeNativeElement?.querySelector('h1')).not.toBeNull();
  });

  it.each(['/admin-panel/dashboard', '/dashboard', '/workspace/resumes', '/workspace/tools'])(
    'keeps authenticated legacy workspace URL %s while showing not found',
    async (url) => {
      authState.set({ status: 'authenticated', user: { username: 'owner' } });
      const harness = await RouterTestingHarness.create();

      await harness.navigateByUrl(url, NotFoundPageComponent);

      expect(router.url).toBe(url);
      expect(harness.routeNativeElement?.querySelector('h1')).not.toBeNull();
    },
  );
});
