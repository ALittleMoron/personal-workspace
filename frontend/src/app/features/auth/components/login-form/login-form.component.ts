import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiError } from '../../../../core/models/api-error.model';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent implements AfterViewInit {
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthSessionService);
  private readonly usernameInput =
    viewChild.required<ElementRef<HTMLInputElement>>('usernameInput');

  readonly authenticated = output<void>();
  readonly busy = signal(false);
  readonly errorKey = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  ngAfterViewInit(): void {
    if (this.document.defaultView !== null) {
      this.usernameInput().nativeElement.focus();
    }
  }

  submit(): void {
    if (this.busy()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorKey.set('auth.login.validationError');
      return;
    }

    this.busy.set(true);
    this.errorKey.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.busy.set(false);
        this.authenticated.emit();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.errorKey.set(loginErrorKey(error));
      },
    });
  }
}

function loginErrorKey(error: unknown): string {
  const status = isApiError(error) ? error.status : undefined;
  if (status === 401) return 'auth.login.invalidCredentials';
  if (status === 429) return 'auth.login.rateLimited';
  if (status === 403) return 'auth.login.forbidden';
  return 'auth.login.serviceError';
}

function isApiError(error: unknown): error is ApiError {
  return error !== null && typeof error === 'object' && 'status' in error;
}
