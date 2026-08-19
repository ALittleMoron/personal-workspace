import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthOverlayService } from '../auth/auth-overlay.service';
import { SKIP_AUTH_RECOVERY } from '../auth/auth-http-context';
import { AuthSessionService } from '../auth/auth-session.service';

export const authRecoveryInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthSessionService);
  const overlay = inject(AuthOverlayService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isProtectedApiRequest(request.url) &&
        !request.context.get(SKIP_AUTH_RECOVERY)
      ) {
        auth.clear();
        overlay.open();
      }
      return throwError(() => error);
    }),
  );
};

function isProtectedApiRequest(url: string): boolean {
  try {
    const pathname = new URL(url, 'https://workspace.local').pathname;
    return /^\/api\/(?:tools|calendar|files|resumes|knowledge|wiki-links)(?:\/|$)/u.test(pathname);
  } catch {
    return false;
  }
}
