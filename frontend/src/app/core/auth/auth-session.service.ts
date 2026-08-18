import { HttpContext } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { ApiClient } from '../http/api-client.service';
import { SKIP_AUTH_RECOVERY } from './auth-http-context';
import { AuthState, LoginRequest, User } from './auth.model';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  readonly state = signal<AuthState>({ status: 'unknown', user: null });

  private readonly api = inject(ApiClient);
  private restoreRequest: Observable<AuthState> | null = null;

  login(request: LoginRequest): Observable<User> {
    return this.api
      .post<User>('/api/auth/login', request, this.authRequestOptions())
      .pipe(tap((user) => this.authenticate(user)));
  }

  restore(): Observable<AuthState> {
    if (this.restoreRequest) {
      return this.restoreRequest;
    }

    this.restoreRequest = this.api.get<User>('/api/auth/session', this.authRequestOptions()).pipe(
      map((user) => this.authenticate(user)),
      catchError(() => of(this.clear())),
      finalize(() => {
        this.restoreRequest = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.restoreRequest;
  }

  logout(): Observable<void> {
    return this.api
      .post<void>('/api/auth/logout', null, { withCredentials: true })
      .pipe(tap(() => this.clear()));
  }

  clear(): AuthState {
    const state: AuthState = { status: 'anonymous', user: null };
    this.state.set(state);
    return state;
  }

  private authenticate(user: User): AuthState {
    const state: AuthState = { status: 'authenticated', user };
    this.state.set(state);
    return state;
  }

  private authRequestOptions(): { context: HttpContext; withCredentials: boolean } {
    return {
      context: new HttpContext().set(SKIP_AUTH_RECOVERY, true),
      withCredentials: true,
    };
  }
}
