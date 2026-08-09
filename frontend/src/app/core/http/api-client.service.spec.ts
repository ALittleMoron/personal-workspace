import { HttpContext, HttpContextToken, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiClient } from './api-client.service';

describe('ApiClient', () => {
  let service: ApiClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiClient, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('uses the same-origin API path and preserves repeated query values', () => {
    service.get<unknown>('/api/items', { itemIds: ['one', 'two'] }).subscribe();

    const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/api/items'));
    expect(request.request.url).toBe('/api/items');
    expect(request.request.params.getAll('itemIds')).toEqual(['one', 'two']);
    request.flush({});
  });

  it('keeps option-like names when they are ordinary query parameters', () => {
    service
      .get<unknown>('/api/items', {
        params: 'compact',
        headers: ['summary', 'details'],
        context: 'workspace',
        withCredentials: 'required',
      })
      .subscribe();

    const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/api/items'));
    expect(request.request.params.get('params')).toBe('compact');
    expect(request.request.params.getAll('headers')).toEqual(['summary', 'details']);
    expect(request.request.params.get('context')).toBe('workspace');
    expect(request.request.params.get('withCredentials')).toBe('required');
    request.flush({});
  });

  it('passes request headers, context, and credentials', () => {
    const contextToken = new HttpContextToken<boolean>(() => false);
    service
      .post<unknown>(
        '/api/items',
        { name: 'item' },
        {
          headers: { 'X-Request-Guard': '1' },
          context: new HttpContext().set(contextToken, true),
          withCredentials: true,
        },
      )
      .subscribe();

    const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/api/items'));
    expect(request.request.headers.get('X-Request-Guard')).toBe('1');
    expect(request.request.context.get(contextToken)).toBe(true);
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({ name: 'item' });
    request.flush({});
  });

  it('requests binary content with the shared request options', () => {
    service
      .getBlob('/api/files/file-id', {
        params: { disposition: 'attachment' },
        headers: { 'X-Request-Guard': '1' },
        withCredentials: true,
      })
      .subscribe();

    const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/api/files/file-id'));
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    expect(request.request.params.get('disposition')).toBe('attachment');
    expect(request.request.headers.get('X-Request-Guard')).toBe('1');
    expect(request.request.withCredentials).toBe(true);
    request.flush(new Blob(['private-content']));
  });

  it('posts a body and receives binary content', () => {
    service
      .postBlob('/api/exports', { format: 'pdf' }, { params: { language: 'en' } })
      .subscribe();

    const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/api/exports'));
    expect(request.request.method).toBe('POST');
    expect(request.request.responseType).toBe('blob');
    expect(request.request.params.get('language')).toBe('en');
    expect(request.request.body).toEqual({ format: 'pdf' });
    request.flush(new Blob(['export']));
  });
});
