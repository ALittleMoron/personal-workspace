import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { map, Observable, of } from 'rxjs';
import { AuthState } from './auth.model';
import { AuthSessionService } from './auth-session.service';

type GuardDecision = boolean | UrlTree;

export const authGuard: CanActivateFn = (_route, state): Observable<GuardDecision> => {
  const router = inject(Router);
  return resolveAuthState().pipe(
    map((authState) => {
      if (authState.status === 'authenticated') {
        return true;
      }
      const pathname = pathnameOf(state.url);
      return router.createUrlTree(['/login'], {
        queryParams: {
          returnUrl: pathname === '/' ? undefined : (sanitizeReturnUrl(state.url) ?? undefined),
        },
      });
    }),
  );
};

export const loginGuard: CanMatchFn = (): Observable<GuardDecision> => {
  const router = inject(Router);
  return resolveAuthState().pipe(
    map((authState) => (authState.status === 'authenticated' ? router.createUrlTree(['/']) : true)),
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

  const path = pathnameOf(value);
  if (!isWorkspaceUrl(path)) {
    return null;
  }

  if (path.split('/').some((segment) => segment === '.' || segment === '..')) {
    return null;
  }
  return value;
}

function isWorkspaceUrl(path: string): boolean {
  return (
    path === '/' ||
    path === '/resumes' ||
    /^\/resumes\/[^/]+$/u.test(path) ||
    path === '/knowledge/people' ||
    /^\/knowledge\/people\/[^/]+$/u.test(path) ||
    path === '/knowledge/dates' ||
    /^\/knowledge\/dates\/[^/]+$/u.test(path)
  );
}

function pathnameOf(url: string): string {
  return url.split(/[?#]/, 1)[0];
}

function resolveAuthState(): Observable<AuthState> {
  const auth = inject(AuthSessionService);
  return auth.state().status === 'unknown' ? auth.restore() : of(auth.state());
}
