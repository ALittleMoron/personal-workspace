import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthState, User } from './auth.model';
import { SKIP_AUTH_RECOVERY } from './auth-http-context';
import { AuthSessionService } from './auth-session.service';
import { ApiClient } from '../http/api-client.service';

describe('AuthSessionService', () => {
  let httpMock: HttpTestingController;
  let service: AuthSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiClient, AuthSessionService],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthSessionService);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => httpMock.verify());

  it('authenticates with credential cookies and keeps the user only in auth state', () => {
    let user: User | undefined;

    service
      .login({ username: 'owner', password: 'correct horse battery staple' })
      .subscribe((value) => {
        user = value;
      });

    const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/api/auth/login'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      username: 'owner',
      password: 'correct horse battery staple',
    });
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.context.get(SKIP_AUTH_RECOVERY)).toBe(true);
    request.flush({ username: 'owner' });

    expect(user).toEqual({ username: 'owner' });
    expect(service.state()).toEqual({ status: 'authenticated', user: { username: 'owner' } });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('shares one active restore request and authenticates both subscribers', () => {
    const states: AuthState[] = [];

    service.restore().subscribe((state) => states.push(state));
    service.restore().subscribe((state) => states.push(state));

    const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/api/auth/session'));
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.context.get(SKIP_AUTH_RECOVERY)).toBe(true);
    request.flush({ username: 'owner' });

    expect(states).toEqual([
      { status: 'authenticated', user: { username: 'owner' } },
      { status: 'authenticated', user: { username: 'owner' } },
    ]);
    expect(service.state()).toEqual({ status: 'authenticated', user: { username: 'owner' } });
  });

  it('starts a fresh restore request after the previous request completes', () => {
    service.restore().subscribe();
    httpMock
      .expectOne((candidate) => candidate.url.endsWith('/api/auth/session'))
      .flush({ username: 'owner' });

    service.restore().subscribe();

    const secondRequest = httpMock.expectOne((candidate) =>
      candidate.url.endsWith('/api/auth/session'),
    );
    expect(secondRequest.request.method).toBe('GET');
    secondRequest.flush({ username: 'owner' });
  });

  it('resolves a failed restore to anonymous state', () => {
    const states: AuthState[] = [];

    service.restore().subscribe((state) => states.push(state));

    const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/api/auth/session'));
    request.flush({ code: 'not_authenticated' }, { status: 401, statusText: 'Unauthorized' });

    expect(states).toEqual([{ status: 'anonymous', user: null }]);
    expect(service.state()).toEqual({ status: 'anonymous', user: null });
  });

  it('keeps the authenticated user when logout fails', () => {
    authenticate();
    let failure: unknown;

    service.logout().subscribe({ error: (error: unknown) => (failure = error) });

    const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/api/auth/logout'));
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ code: 'csrf_failed' }, { status: 403, statusText: 'Forbidden' });

    expect(failure).toBeInstanceOf(HttpErrorResponse);
    expect(service.state()).toEqual({ status: 'authenticated', user: { username: 'owner' } });
  });

  it('clears the authenticated user after a successful logout response', () => {
    authenticate();

    service.logout().subscribe();

    const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/api/auth/logout'));
    request.flush(null);

    expect(service.state()).toEqual({ status: 'anonymous', user: null });
  });

  function authenticate(): void {
    service.login({ username: 'owner', password: 'correct horse battery staple' }).subscribe();
    httpMock
      .expectOne((candidate) => candidate.url.endsWith('/api/auth/login'))
      .flush({ username: 'owner' });
  }
});
