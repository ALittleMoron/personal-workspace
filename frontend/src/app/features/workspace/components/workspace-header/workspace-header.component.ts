import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { LanguageCode } from '../../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { ThemeService } from '../../../../core/layout/theme.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';

interface LanguageOption {
  code: LanguageCode;
  label: string;
  shortLabel: string;
  selected: boolean;
}

@Component({
  selector: 'app-workspace-header',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workspace-header.component.html',
  styleUrl: './workspace-header.component.scss',
})
export class WorkspaceHeaderComponent {
  private readonly accountMenu = viewChild<ElementRef<HTMLElement>>('accountMenu');
  private readonly i18n = inject(I18nService);
  private readonly themeService = inject(ThemeService);
  private readonly auth = inject(AuthSessionService);
  private readonly unsavedChanges = inject(UnsavedChangesService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly busy = signal(false);
  readonly languageMenuOpen = signal(false);
  readonly menuOpen = signal(false);
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

  onMenuToggle(event: ToggleEvent): void {
    this.menuOpen.set(event.newState === 'open');
    if (event.newState === 'closed') {
      this.languageMenuOpen.set(false);
    }
  }

  toggleLanguageMenu(): void {
    this.languageMenuOpen.update((open) => !open);
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  closeMenu(): void {
    const menu = this.accountMenu()?.nativeElement;
    if (this.menuOpen() && typeof menu?.hidePopover === 'function') {
      menu.hidePopover();
    }
    this.menuOpen.set(false);
    this.languageMenuOpen.set(false);
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
}
