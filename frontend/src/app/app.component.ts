import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { I18nService } from './core/i18n/i18n.service';
import { isLanguageCode } from './core/i18n/i18n.model';
import { TranslatePipe } from './core/i18n/translate.pipe';
import { ThemeService } from './core/layout/theme.service';
import { NotificationAreaComponent } from './core/notifications/notification-area.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslatePipe, NotificationAreaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-notification-area />
    <div class="container py-4 py-md-5">
      @if (i18n.startupState() !== 'ready') {
        <main>
          <section class="surface-card p-4" role="alert">
            <p class="mb-3">{{ 'error.generic' | t }}</p>
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="retrying()"
              (click)="retryStartup()"
            >
              {{ 'shared.retry' | t }}
            </button>
          </section>
        </main>
      } @else {
        <div class="d-flex flex-wrap justify-content-end align-items-center gap-2 mb-3">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            [attr.aria-label]="'theme.toggle' | t"
            [attr.aria-pressed]="theme.theme() === 'dark'"
            [attr.title]="'theme.toggle' | t"
            (click)="theme.toggleTheme()"
          >
            <span aria-hidden="true">{{ theme.theme() === 'dark' ? '☾' : '☀' }}</span>
            <span class="visually-hidden">
              {{ (theme.theme() === 'dark' ? 'theme.dark' : 'theme.light') | t }}
            </span>
          </button>
          <label class="d-flex align-items-center gap-2">
            <span>{{ 'language.label' | t }}</span>
            <select
              class="form-select form-select-sm"
              [value]="i18n.language()"
              (change)="switchLanguage($event)"
            >
              @for (language of i18n.languages(); track language.code) {
                <option [value]="language.code">{{ language.label }}</option>
              }
            </select>
          </label>
        </div>
        <main>
          <router-outlet />
        </main>
      }
    </div>
  `,
})
export class AppComponent {
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);
  readonly retrying = signal(false);

  retryStartup(): void {
    if (this.retrying()) return;
    this.retrying.set(true);
    this.i18n
      .retryStartup()
      .pipe(finalize(() => this.retrying.set(false)))
      .subscribe();
  }

  switchLanguage(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : null;
    if (!isLanguageCode(value)) return;
    this.i18n.switchLanguage(value).subscribe();
  }
}
