import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { LanguageCode } from '../../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { ThemeService } from '../../../../core/layout/theme.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { localizedPublicHomePath } from '../../../../core/routing/public-home';
import { AdminUnsavedChangesService } from '../../services/admin-unsaved-changes.service';

interface LanguageOption {
  code: LanguageCode;
  label: string;
  shortLabel: string;
  selected: boolean;
}

@Component({
  selector: 'app-admin-panel-header',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-panel-header.component.html',
  styleUrl: './admin-panel-header.component.scss',
})
export class AdminPanelHeaderComponent {
  private readonly i18n = inject(I18nService);
  private readonly themeService = inject(ThemeService);
  private readonly auth = inject(AuthSessionService);
  private readonly unsavedChanges = inject(AdminUnsavedChangesService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly busy = signal(false);
  readonly homeLink = computed(() => localizedPublicHomePath(this.currentLanguage()));
  readonly username = computed(() => this.auth.state().user?.username ?? '');
  readonly toggleLabel = computed(() =>
    this.i18n.translate(
      this.themeService.theme() === 'light' ? 'shell.theme.dark' : 'shell.theme.light',
    ),
  );
  readonly languageOptions = computed<LanguageOption[]>(() => {
    const currentLanguage = this.i18n.language();
    return this.i18n.languages().map((language) => ({
      code: language.code,
      label: language.label,
      shortLabel: language.code.toUpperCase(),
      selected: language.code === currentLanguage,
    }));
  });

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  switchLanguage(language: LanguageCode): void {
    this.i18n.switchLanguage(language).subscribe();
  }

  requestLogout(): void {
    if (this.busy() || !this.unsavedChanges.confirmDiscard()) return;

    this.busy.set(true);
    this.auth
      .logout()
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.unsavedChanges.discardChanges();
          this.router.navigateByUrl('/login');
        },
        error: () => this.notifications.error(this.i18n.translate('auth.logout.failed')),
      });
  }

  private currentLanguage(): LanguageCode {
    const language = this.i18n.language();
    if (language === null) {
      throw new Error('I18n language is not initialized');
    }
    return language;
  }
}
