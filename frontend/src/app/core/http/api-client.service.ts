import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type QueryParams = Record<string, string | readonly string[]>;

export interface ApiRequestOptions {
  params?: QueryParams;
  headers?: HttpHeaders | Record<string, string | string[]>;
  context?: HttpContext;
  withCredentials?: boolean;
}

type ParamsOrOptions = QueryParams | ApiRequestOptions;

interface HttpClientOptions {
  params?: HttpParams;
  headers?: HttpHeaders | Record<string, string | string[]>;
  context?: HttpContext;
  withCredentials?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string, paramsOrOptions?: ParamsOrOptions): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, this.toHttpOptions(paramsOrOptions));
  }

  getBlob(path: string, paramsOrOptions?: ParamsOrOptions): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${path}`, {
      ...this.toHttpOptions(paramsOrOptions),
      responseType: 'blob',
    });
  }

  post<T>(path: string, body: unknown, paramsOrOptions?: ParamsOrOptions): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, this.toHttpOptions(paramsOrOptions));
  }

  postBlob(path: string, body: unknown, paramsOrOptions?: ParamsOrOptions): Observable<Blob> {
    return this.http.post(`${this.baseUrl}${path}`, body, {
      ...this.toHttpOptions(paramsOrOptions),
      responseType: 'blob',
    });
  }

  put<T>(path: string, body: unknown, paramsOrOptions?: ParamsOrOptions): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body, this.toHttpOptions(paramsOrOptions));
  }

  patch<T>(path: string, body: unknown, paramsOrOptions?: ParamsOrOptions): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body, this.toHttpOptions(paramsOrOptions));
  }

  delete<T>(path: string, paramsOrOptions?: ParamsOrOptions): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, this.toHttpOptions(paramsOrOptions));
  }

  private toHttpOptions(paramsOrOptions?: ParamsOrOptions): HttpClientOptions {
    if (paramsOrOptions === undefined) return {};
    if (this.isRequestOptions(paramsOrOptions)) {
      return {
        ...paramsOrOptions,
        params:
          paramsOrOptions.params === undefined
            ? undefined
            : new HttpParams({ fromObject: paramsOrOptions.params }),
      };
    }
    return { params: new HttpParams({ fromObject: paramsOrOptions }) };
  }

  private isRequestOptions(value: ParamsOrOptions): value is ApiRequestOptions {
    return (
      this.hasObjectOption(value, 'params') ||
      this.hasObjectOption(value, 'headers') ||
      this.hasObjectOption(value, 'context') ||
      typeof value.withCredentials === 'boolean'
    );
  }

  private hasObjectOption(value: ParamsOrOptions, key: 'params' | 'headers' | 'context'): boolean {
    const option = value[key];
    return typeof option === 'object' && option !== null && !Array.isArray(option);
  }
}
