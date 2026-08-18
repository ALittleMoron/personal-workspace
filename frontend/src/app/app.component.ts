import { DOCUMENT, PlatformLocation } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { I18nService } from './core/i18n/i18n.service';
import { AuthOverlayService } from './core/auth/auth-overlay.service';
import { CookieConsentBannerComponent } from './features/shell/components/cookie-consent-banner/cookie-consent-banner.component';
import { LoginFormComponent } from './features/auth/components/login-form/login-form.component';
import { NotificationAreaComponent } from './features/shell/components/notification-area/notification-area.component';
import { SiteFooterComponent } from './features/shell/components/site-footer/site-footer.component';
import { SiteHeaderComponent } from './features/shell/components/site-header/site-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SiteHeaderComponent,
    SiteFooterComponent,
    NotificationAreaComponent,
    CookieConsentBannerComponent,
    LoginFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss',
  template: `
    @if (i18n.startupError()) {
      <main
        class="app-shell gradient-body d-flex align-items-center justify-content-center min-vh-100"
      >
        <section class="text-center px-3">
          <h1 class="h4">{{ i18n.translate('i18n.startupError.title') }}</h1>
          <p class="text-body-secondary">{{ i18n.translate('i18n.startupError.message') }}</p>
          <button type="button" class="btn btn-primary" (click)="retryI18n()">
            {{ i18n.translate('i18n.startupError.retry') }}
          </button>
        </section>
      </main>
    } @else {
      <div class="app-shell gradient-body d-flex flex-column min-vh-100">
        <div
          class="app-background d-flex flex-column flex-grow-1"
          data-testid="app-background"
          [attr.inert]="authOverlay.loginRequired() ? '' : null"
          [attr.aria-hidden]="authOverlay.loginRequired() ? 'true' : null"
          (focusin)="rememberBackgroundFocus($event)"
        >
          @if (!isShelllessRoute()) {
            <app-site-header />
          }
          <app-notification-area />
          <router-outlet />
          @if (!isShelllessRoute()) {
            <app-site-footer class="mt-auto" />
          }
          @if (!isShelllessRoute()) {
            <app-cookie-consent-banner />
          }
        </div>
        @if (authOverlay.loginRequired()) {
          <section
            class="auth-overlay position-fixed top-0 start-0 w-100 min-vh-100 d-flex align-items-center justify-content-center p-3 bg-body"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-expired-title"
            aria-describedby="session-expired-message"
            (keydown)="trapOverlayFocus($event)"
          >
            <div class="auth-overlay__card card border-0 shadow-sm w-100">
              <div class="card-body p-4 p-sm-5">
                <h1 id="session-expired-title" class="h3 mb-2">
                  {{ i18n.translate('auth.sessionExpired.title') }}
                </h1>
                <p id="session-expired-message" class="text-body-secondary mb-4">
                  {{ i18n.translate('auth.sessionExpired.message') }}
                </p>
                <app-login-form (authenticated)="closeLoginOverlay()" />
              </div>
            </div>
          </section>
        }
      </div>
    }
  `,
})
export class AppComponent {
  private readonly document = inject(DOCUMENT);
  private readonly platformLocation = inject(PlatformLocation);
  private readonly router = inject(Router);
  private previousBackgroundFocus: HTMLElement | null = null;
  readonly authOverlay = inject(AuthOverlayService);

  readonly i18n = inject(I18nService);
  readonly isShelllessRoute = signal(
    isShelllessUrl(
      `${this.platformLocation.pathname}${this.platformLocation.search}${this.platformLocation.hash}`,
    ),
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.isShelllessRoute.set(isShelllessUrl(event.urlAfterRedirects));
      });
  }

  retryI18n(): void {
    this.i18n.retryStartup().subscribe();
  }

  closeLoginOverlay(): void {
    this.authOverlay.close();
    const previousFocus = this.previousBackgroundFocus;
    this.previousBackgroundFocus = null;
    const timerWindow = this.document.defaultView;
    if (timerWindow === null || previousFocus === null) return;
    timerWindow.setTimeout(() => {
      if (previousFocus.isConnected) previousFocus.focus();
    });
  }

  rememberBackgroundFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    if (target !== null && typeof target.focus === 'function') {
      this.previousBackgroundFocus = target;
    }
  }

  trapOverlayFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const dialog = event.currentTarget as HTMLElement | null;
    if (dialog === null) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusable.at(0);
    const last = focusable.at(-1);
    if (first === undefined || last === undefined) return;

    const activeElement = this.document.activeElement;
    if (event.shiftKey ? activeElement === first : activeElement === last) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  }
}

export function isAdminPanelUrl(url: string): boolean {
  const pathname = new URL(url, 'http://localhost').pathname;
  return pathname === '/admin-panel' || pathname.startsWith('/admin-panel/');
}

export function isShelllessUrl(url: string): boolean {
  const pathname = new URL(url, 'http://localhost').pathname;
  return pathname === '/login' || isAdminPanelUrl(url);
}
