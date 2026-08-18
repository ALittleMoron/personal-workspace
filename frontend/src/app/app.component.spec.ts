import { PlatformLocation } from '@angular/common';
import { MOCK_PLATFORM_LOCATION_CONFIG, MockPlatformLocation } from '@angular/common/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { I18nService } from './core/i18n/i18n.service';
import { AuthOverlayService } from './core/auth/auth-overlay.service';
import { AuthSessionService } from './core/auth/auth-session.service';
import { ThemeName, ThemeService } from './core/layout/theme.service';
import { createI18nTestingValue } from './testing/i18n-testing';

@Component({ standalone: true, template: '<button id="workspace-control">Workspace</button>' })
class AdminRouteComponent {
  static instanceCount = 0;

  constructor() {
    AdminRouteComponent.instanceCount += 1;
  }
}

@Component({ standalone: true, template: '<main>Login route</main>' })
class LoginRouteComponent {}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let startupError: ReturnType<typeof signal<boolean>>;
  let retryStartup: jest.Mock;
  let loginRequired: ReturnType<typeof signal<boolean>>;
  let closeOverlay: jest.Mock;
  let login: jest.Mock;

  beforeEach(async () => {
    startupError = signal(false);
    retryStartup = jest.fn(() => of(void 0));
    loginRequired = signal(false);
    closeOverlay = jest.fn(() => loginRequired.set(false));
    login = jest.fn(() => of({ username: 'owner' }));
    AdminRouteComponent.instanceCount = 0;

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([
          { path: 'admin-panel', component: AdminRouteComponent },
          { path: 'login', component: LoginRouteComponent },
        ]),
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
        { provide: AuthOverlayService, useValue: { loginRequired, close: closeOverlay } },
        { provide: AuthSessionService, useValue: { login } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  afterEach(() => jest.useRealTimers());

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

  it('removes the complete public chrome while the login route is active', async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/login');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-site-header')).toBeNull();
    expect(element.querySelector('app-site-footer')).toBeNull();
    expect(element.querySelector('app-cookie-consent-banner')).toBeNull();
  });

  it('keeps the routed workspace mounted and inaccessible behind the login-required dialog', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/admin-panel');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const workspace = element.querySelector('#workspace-control');

    loginRequired.set(true);
    fixture.detectChanges();

    const background = element.querySelector('[data-testid="app-background"]');
    expect(background?.hasAttribute('inert')).toBe(true);
    expect(background?.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelector('#workspace-control')).toBe(workspace);
    expect(AdminRouteComponent.instanceCount).toBe(1);
    expect(element.querySelector('router-outlet')).not.toBeNull();
    expect(element.querySelector('[role="dialog"]')).not.toBeNull();
    expect(element.querySelector('[role="dialog"] button[aria-label="Close"]')).toBeNull();
  });

  it('wraps keyboard focus within the login-required dialog', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/admin-panel');
    loginRequired.set(true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const dialog = element.querySelector('[role="dialog"]') as HTMLElement;
    const username = dialog.querySelector('input[name="username"]') as HTMLInputElement;
    const submit = dialog.querySelector('button[type="submit"]') as HTMLButtonElement;

    submit.focus();
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(username);

    username.focus();
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    expect(document.activeElement).toBe(submit);
  });

  it('restores prior focus and preserves the routed instance after successful overlay login', async () => {
    jest.useFakeTimers();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/admin-panel');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const workspace = element.querySelector('#workspace-control') as HTMLButtonElement;
    workspace.focus();

    loginRequired.set(true);
    fixture.detectChanges();
    const username = element.querySelector('input[name="username"]') as HTMLInputElement;
    const password = element.querySelector('input[name="password"]') as HTMLInputElement;
    username.value = 'owner';
    username.dispatchEvent(new Event('input'));
    password.value = 'secret';
    password.dispatchEvent(new Event('input'));
    (element.querySelector('[role="dialog"] form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    fixture.detectChanges();
    jest.runOnlyPendingTimers();

    expect(closeOverlay).toHaveBeenCalledTimes(1);
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(element.querySelector('#workspace-control')).toBe(workspace);
    expect(AdminRouteComponent.instanceCount).toBe(1);
    expect(router.url).toBe('/admin-panel');
    expect(document.activeElement).toBe(workspace);
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

describe('AppComponent direct shellless bootstrap', () => {
  it.each(['/login', '/admin-panel/knowledge/people'])(
    'does not render public chrome before initial navigation at %s',
    async (initialUrl) => {
      await TestBed.configureTestingModule({
        imports: [AppComponent],
        providers: [
          provideRouter([]),
          { provide: PlatformLocation, useClass: MockPlatformLocation },
          {
            provide: MOCK_PLATFORM_LOCATION_CONFIG,
            useValue: { startUrl: initialUrl },
          },
          { provide: I18nService, useValue: createI18nTestingValue() },
          {
            provide: ThemeService,
            useValue: { theme: signal<ThemeName>('light'), toggleTheme: jest.fn() },
          },
          {
            provide: AuthOverlayService,
            useValue: { loginRequired: signal(false), close: jest.fn() },
          },
          {
            provide: AuthSessionService,
            useValue: { login: jest.fn(() => of({ username: 'owner' })) },
          },
        ],
      }).compileComponents();

      const directFixture = TestBed.createComponent(AppComponent);
      directFixture.detectChanges();
      const element = directFixture.nativeElement as HTMLElement;

      expect(element.querySelector('app-site-header')).toBeNull();
      expect(element.querySelector('app-site-footer')).toBeNull();
      expect(element.querySelector('app-cookie-consent-banner')).toBeNull();
    },
  );
});
