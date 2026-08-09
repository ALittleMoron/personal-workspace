import { TestBed } from '@angular/core/testing';
import { MarkdownRendererService } from './markdown-renderer.service';

describe('MarkdownRendererService', () => {
  let service: MarkdownRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarkdownRendererService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('strips scripts, event handlers, and executable URL schemes', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const html = service.render(
      [
        'Text before.',
        '<script>alert("script")</script>',
        '<img src=x onerror="alert(1)">',
        '<a href="javascript:alert(2)">bad link</a>',
      ].join('\n'),
    );

    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toMatch(/href=["']javascript:/i);
    expect(html).toContain('bad link');
  });

  it('highlights supported fenced code through the shared syntax highlighter', () => {
    const html = service.render('```typescript\nconst ready = true;\n```');
    expect(html).toContain('class="markdown-code"');
    expect(html).toContain('language-typescript');
    expect(html).toContain('token keyword');
  });
});
