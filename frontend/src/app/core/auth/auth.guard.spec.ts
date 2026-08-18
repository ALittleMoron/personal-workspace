import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { AuthState } from './auth.model';
import { authGuard, loginGuard, sanitizeReturnUrl, workspaceEntryGuard } from './auth.guard';
import { AuthSessionService } from './auth-session.service';

describe('authentication guards', () => {
  let auth: { state: WritableSignal<AuthState>; restore: jest.Mock };
  let router: Router;

  beforeEach(() => {
    const state = signal<AuthState>({ status: 'unknown', user: null });
    auth = {
      state,
      restore: jest.fn(() => of(state())),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthSessionService, useValue: auth }],
    });
    router = TestBed.inject(Router);
  });

  it('restores an unknown session before allowing a protected route', async () => {
    auth.restore.mockReturnValue(of({ status: 'authenticated', user: { username: 'owner' } }));

    const result = await runAuthGuard('/admin-panel/dashboard');

    expect(result).toBe(true);
    expect(auth.restore).toHaveBeenCalledTimes(1);
  });

  it('sends anonymous protected-route visitors to login with an internal return URL', async () => {
    auth.state.set({ status: 'anonymous', user: null });

    const result = await runAuthGuard('/admin-panel/knowledge/people?filter=active');

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/login?returnUrl=%2Fadmin-panel%2Fknowledge%2Fpeople%3Ffilter%3Dactive',
    );
  });

  it('redirects authenticated login visitors to the workspace dashboard', async () => {
    auth.state.set({ status: 'authenticated', user: { username: 'owner' } });

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => loginGuard({} as never, [])),
    );

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/admin-panel/dashboard',
    );
  });

  it('allows anonymous login visitors', async () => {
    auth.state.set({ status: 'anonymous', user: null });

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => loginGuard({} as never, [])),
    );

    expect(result).toBe(true);
  });

  it('redirects an authenticated browser root to the workspace dashboard', async () => {
    auth.state.set({ status: 'authenticated', user: { username: 'owner' } });

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => workspaceEntryGuard({} as never, { url: '/' } as never)),
    );

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/admin-panel/dashboard',
    );
  });

  it.each([
    ['/', '/'],
    ['/admin-panel', '/admin-panel'],
    ['/admin-panel/dashboard?tab=activity', '/admin-panel/dashboard?tab=activity'],
    ['https://evil.example', null],
    ['//evil.example', null],
    ['/updates', null],
    ['/admin-panelx', null],
    ['/admin-panel/../updates', null],
    ['/admin-panel\\evil', null],
    ['/%2f%2fevil.example', null],
    ['/admin-panel/%2e%2e/updates', null],
  ])('sanitizes return URL %s', (input, expected) => {
    expect(sanitizeReturnUrl(input)).toBe(expected);
  });

  async function runAuthGuard(url: string): Promise<unknown> {
    return firstValueFrom(
      TestBed.runInInjectionContext(() => authGuard({} as never, { url } as never)),
    );
  }
});
