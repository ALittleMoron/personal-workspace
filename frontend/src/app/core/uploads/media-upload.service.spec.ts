import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiClient } from '../http/api-client.service';
import { MediaUploadService } from './media-upload.service';

describe('MediaUploadService', () => {
  let service: MediaUploadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MediaUploadService, ApiClient, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MediaUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends a retained attachment as multipart data and returns its backend identifier', () => {
    let uploadedId = '';
    const file = new File(['attachment'], 'notes.txt', { type: 'text/plain' });

    service
      .uploadMediaFile({
        file,
        purpose: 'attachment',
        name: 'Meeting notes',
        fileName: file.name,
      })
      .subscribe((uploaded) => {
        uploadedId = uploaded.id;
      });

    const request = httpMock.expectOne((item) => item.url.endsWith('/api/admin/files'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);
    const formData = request.request.body as FormData;
    expect(formData.get('purpose')).toBe('attachment');
    expect(formData.get('name')).toBe('Meeting notes');
    expect((formData.get('file') as File).name).toBe('notes.txt');
    request.flush(fileDto());

    expect(uploadedId).toBe('file-1');
  });

  it('loads managed attachment metadata by its identifier', () => {
    let accessUrl = '';

    service.getMediaFile('file-1').subscribe((file) => {
      accessUrl = file.accessUrl;
    });

    const request = httpMock.expectOne((item) => item.url.endsWith('/api/admin/files/file-1'));
    expect(request.request.method).toBe('GET');
    request.flush(fileDto());

    expect(accessUrl).toBe('https://cdn.example.test/private/notes.txt');
  });
});

function fileDto(): object {
  return {
    id: 'file-1',
    purpose: 'attachment',
    namespace: 'knowledge',
    relativePath: 'attachments/notes.txt',
    mimeType: 'text/plain',
    sizeBytes: 10,
    name: 'Meeting notes',
    originalName: 'notes.txt',
    createdAt: '2026-08-11T10:00:00Z',
    updatedAt: '2026-08-11T10:00:00Z',
    accessUrl: 'https://cdn.example.test/private/notes.txt',
    markdownUrl: 'https://cdn.example.test/private/notes.txt#fileId=file-1',
  };
}
