import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  it('maps HTTP failures to the canonical API error shape', (done) => {
    const request = new HttpRequest('GET', '/api/items');
    const next: HttpHandlerFn = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              code: 'invalid_request',
              type: 'validation',
              message: 'Invalid request.',
              location: 'body',
              attr: 'name',
            },
          }),
      );

    TestBed.runInInjectionContext(() => errorInterceptor(request, next)).subscribe({
      error: (error: unknown) => {
        expect(error).toEqual({
          code: 'invalid_request',
          type: 'validation',
          message: 'Invalid request.',
          status: 400,
          location: 'body',
          attr: 'name',
          nested_errors: undefined,
        });
        done();
      },
    });
  });

  it('preserves non-HTTP failures', (done) => {
    const failure = new Error('Unexpected failure');
    const request = new HttpRequest('GET', '/api/items');
    const next: HttpHandlerFn = () => throwError(() => failure);

    TestBed.runInInjectionContext(() => errorInterceptor(request, next)).subscribe({
      error: (error: unknown) => {
        expect(error).toBe(failure);
        done();
      },
    });
  });
});
