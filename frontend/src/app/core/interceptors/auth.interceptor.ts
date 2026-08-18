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
        isAdminApiRequest(request.url) &&
        !request.context.get(SKIP_AUTH_RECOVERY)
      ) {
        auth.clear();
        overlay.open();
      }
      return throwError(() => error);
    }),
  );
};

function isAdminApiRequest(url: string): boolean {
  return /^(?:https?:\/\/[^/]+)?\/api\/admin(?:\/|$)/.test(url);
}
