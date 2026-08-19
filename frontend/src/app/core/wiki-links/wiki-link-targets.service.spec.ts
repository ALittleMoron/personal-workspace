import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiClient } from '../http/api-client.service';
import { WikiLinkTargetsService } from './wiki-link-targets.service';
import { WikiLinkTargetRegistry } from './wiki-links';

describe('WikiLinkTargetsService', () => {
  let service: WikiLinkTargetsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WikiLinkTargetsService,
        ApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(WikiLinkTargetsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads the current empty wiki-link registry with explicit language', () => {
    let received: WikiLinkTargetRegistry | undefined;

    service.getTargets('ru').subscribe((registry) => (received = registry));

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/wiki-links/targets'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('language')).toBe('ru');
    req.flush({ targets: [] });

    expect(received?.groups).toEqual([]);
    expect(received?.lookup.size).toBe(0);
  });

  it('does not restore removed target domains from a stale response', () => {
    let received: WikiLinkTargetRegistry | undefined;

    service.getTargets('en').subscribe((registry) => (received = registry));

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/wiki-links/targets'));
    req.flush({
      targets: [
        {
          type: 'articles',
          items: [{ slug: 'legacy', title: 'Legacy', publishStatus: 'Published' }],
        },
      ],
    });

    expect(received?.groups).toEqual([]);
    expect(received?.lookup.size).toBe(0);
  });

  it('shares one HTTP request between subscribers for the same language', () => {
    const first = jest.fn();
    const second = jest.fn();

    service.getTargets('ru').subscribe(first);
    service.getTargets('ru').subscribe(second);

    const requests = httpMock.match((request) => request.url.endsWith('/api/wiki-links/targets'));
    expect(requests).toHaveLength(1);
    requests[0].flush({ targets: [] });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('caches RU and EN registries separately', () => {
    service.getTargets('ru').subscribe();
    service.getTargets('en').subscribe();
    service.getTargets('ru').subscribe();

    const requests = httpMock.match((request) => request.url.endsWith('/api/wiki-links/targets'));
    expect(requests).toHaveLength(2);
    expect(requests.map((request) => request.request.params.get('language'))).toEqual(['ru', 'en']);
    for (const request of requests) {
      request.flush({ targets: [] });
    }
  });
});
