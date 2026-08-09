import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../error/api-error.model';

export const errorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(catchError((error: unknown) => throwError(() => toApiError(error))));

export function toApiError(error: unknown): ApiError | unknown {
  if (!(error instanceof HttpErrorResponse)) return error;
  const body = isRecord(error.error) ? error.error : {};
  return {
    code: stringField(body, 'code') ?? 'unknown',
    type: stringField(body, 'type') ?? 'unknown',
    message: stringField(body, 'message') ?? error.message,
    status: error.status,
    location: nullableStringField(body, 'location'),
    attr: nullableStringField(body, 'attr'),
    nested_errors: apiErrorArray(body['nested_errors']),
  };
}

function apiErrorArray(value: unknown): readonly ApiError[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(isRecord).map((item) => {
    const status = numberField(item, 'status');
    return {
      code: stringField(item, 'code') ?? 'unknown',
      type: stringField(item, 'type') ?? 'unknown',
      message: stringField(item, 'message') ?? '',
      ...(status === null ? {} : { status }),
      location: nullableStringField(item, 'location'),
      attr: nullableStringField(item, 'attr'),
      nested_errors: apiErrorArray(item['nested_errors']),
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function stringField(value: Record<string, unknown>, key: string): string | null {
  return typeof value[key] === 'string' ? value[key] : null;
}

function numberField(value: Record<string, unknown>, key: string): number | null {
  return typeof value[key] === 'number' ? value[key] : null;
}

function nullableStringField(value: Record<string, unknown>, key: string): string | null {
  const field = value[key];
  return typeof field === 'string' ? field : null;
}
