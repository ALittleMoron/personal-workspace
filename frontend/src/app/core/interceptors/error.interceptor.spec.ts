import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  it('preserves a backend error context for callers to render', (done) => {
    const request = new HttpRequest('POST', '/api/tools/cache/warm');
    const next: HttpHandlerFn = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              code: 'invalid_request',
              type: 'bad_request',
              message: 'The cache warm request is invalid.',
              location: 'body',
              attr: 'operation',
              nested_errors: [
                {
                  code: 'invalid_request',
                  type: 'bad_request',
                  message: 'Operation is required.',
                  location: 'body',
                  attr: 'operation.id',
                },
              ],
            },
          }),
      );

    TestBed.runInInjectionContext(() => errorInterceptor(request, next)).subscribe({
      error: (error: unknown) => {
        expect(error).toEqual({
          code: 'invalid_request',
          type: 'bad_request',
          message: 'The cache warm request is invalid.',
          status: 400,
          location: 'body',
          attr: 'operation',
          nested_errors: [
            {
              code: 'invalid_request',
              type: 'bad_request',
              message: 'Operation is required.',
              location: 'body',
              attr: 'operation.id',
            },
          ],
        });
        done();
      },
    });
  });

  it('provides a safe error shape for a non-JSON HTTP failure', (done) => {
    const request = new HttpRequest('GET', '/api/i18n/languages');
    const next: HttpHandlerFn = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            statusText: 'Service Unavailable',
            error: '<html>temporarily unavailable</html>',
          }),
      );

    TestBed.runInInjectionContext(() => errorInterceptor(request, next)).subscribe({
      error: (error: unknown) => {
        expect(error).toEqual({
          code: 'unknown',
          type: 'unknown',
          message: expect.any(String),
          status: 503,
          location: null,
          attr: null,
          nested_errors: undefined,
        });
        done();
      },
    });
  });

  it('does not replace non-HTTP failures raised by a caller dependency', (done) => {
    const failure = new Error('Offline storage is unavailable');
    const request = new HttpRequest('GET', '/api/i18n/languages');
    const next: HttpHandlerFn = () => throwError(() => failure);

    TestBed.runInInjectionContext(() => errorInterceptor(request, next)).subscribe({
      error: (error: unknown) => {
        expect(error).toBe(failure);
        done();
      },
    });
  });
});
