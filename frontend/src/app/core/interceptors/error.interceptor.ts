import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api-error.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      return throwError(() => toApiError(error));
    }),
  );
};

function toApiError(error: unknown): ApiError | unknown {
  if (!(error instanceof HttpErrorResponse)) {
    return error;
  }
  const body = isApiErrorBody(error.error) ? error.error : null;
  return {
    code: body?.code ?? 'unknown',
    type: body?.type ?? 'unknown',
    message: body?.message ?? error.message,
    status: error.status,
    location: body?.location ?? null,
    attr: body?.attr ?? null,
    nested_errors: body?.nested_errors,
  };
}

function isApiErrorBody(value: unknown): value is Partial<ApiError> {
  return value !== null && typeof value === 'object';
}
