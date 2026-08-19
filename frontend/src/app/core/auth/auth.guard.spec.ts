import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { AuthState } from './auth.model';
import { authGuard, loginGuard, sanitizeReturnUrl } from './auth.guard';
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

    const result = await runAuthGuard('/');

    expect(result).toBe(true);
    expect(auth.restore).toHaveBeenCalledTimes(1);
  });

  it('sends anonymous protected-route visitors to login with an internal return URL', async () => {
    auth.state.set({ status: 'anonymous', user: null });

    const result = await runAuthGuard('/knowledge/people?filter=active');

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/login?returnUrl=%2Fknowledge%2Fpeople%3Ffilter%3Dactive',
    );
  });

  it.each(['/?next=/knowledge/people', '/#workspace'])(
    'sends an anonymous root URL %s to login without a return URL',
    async (url) => {
      auth.state.set({ status: 'anonymous', user: null });

      const result = await runAuthGuard(url);

      expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/login');
    },
  );

  it('redirects authenticated login visitors to the workspace root', async () => {
    auth.state.set({ status: 'authenticated', user: { username: 'owner' } });

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => loginGuard({} as never, [])),
    );

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/');
  });

  it('allows anonymous login visitors', async () => {
    auth.state.set({ status: 'anonymous', user: null });

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => loginGuard({} as never, [])),
    );

    expect(result).toBe(true);
  });

  it.each([
    ['/', '/'],
    ['/resumes?tab=activity', '/resumes?tab=activity'],
    [
      '/knowledge/people/person-1?tab=relationships',
      '/knowledge/people/person-1?tab=relationships',
    ],
    ['/knowledge/dates/date-1', '/knowledge/dates/date-1'],
    ['https://evil.example', null],
    ['//evil.example', null],
    ['/updates', null],
    ['/admin-panel', null],
    ['/dashboard', null],
    ['/workspace/resumes', null],
    ['/knowledge/../updates', null],
    ['/knowledge\\evil', null],
    ['/%2f%2fevil.example', null],
    ['/knowledge/%2e%2e/updates', null],
  ])('sanitizes return URL %s', (input, expected) => {
    expect(sanitizeReturnUrl(input)).toBe(expected);
  });

  async function runAuthGuard(url: string): Promise<unknown> {
    return firstValueFrom(
      TestBed.runInInjectionContext(() => authGuard({} as never, { url } as never)),
    );
  }
});
