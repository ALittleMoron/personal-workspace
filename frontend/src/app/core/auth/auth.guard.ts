import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { map, Observable, of } from 'rxjs';
import { AuthState } from './auth.model';
import { AuthSessionService } from './auth-session.service';

type GuardDecision = boolean | UrlTree;

export const authGuard: CanActivateFn = (_route, state): Observable<GuardDecision> => {
  const router = inject(Router);
  return resolveAuthState().pipe(
    map((authState) =>
      authState.status === 'authenticated'
        ? true
        : router.createUrlTree(['/login'], {
            queryParams: { returnUrl: sanitizeReturnUrl(state.url) ?? undefined },
          }),
    ),
  );
};

export const loginGuard: CanMatchFn = (): Observable<GuardDecision> => {
  const router = inject(Router);
  return resolveAuthState().pipe(
    map((authState) =>
      authState.status === 'authenticated'
        ? router.createUrlTree(['/admin-panel/dashboard'])
        : true,
    ),
  );
};

export const workspaceEntryGuard: CanActivateFn = (): Observable<GuardDecision> => {
  const router = inject(Router);
  return resolveAuthState().pipe(
    map((authState) =>
      authState.status === 'authenticated'
        ? router.createUrlTree(['/admin-panel/dashboard'])
        : router.createUrlTree(['/login']),
    ),
  );
};

export function sanitizeReturnUrl(value: string | null | undefined): string | null {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    value.includes('%')
  ) {
    return null;
  }

  const path = value.split(/[?#]/, 1)[0];
  if (path !== '/' && path !== '/admin-panel' && !path.startsWith('/admin-panel/')) {
    return null;
  }

  if (path.split('/').some((segment) => segment === '.' || segment === '..')) {
    return null;
  }
  return value;
}

function resolveAuthState(): Observable<AuthState> {
  const auth = inject(AuthSessionService);
  return auth.state().status === 'unknown' ? auth.restore() : of(auth.state());
}
