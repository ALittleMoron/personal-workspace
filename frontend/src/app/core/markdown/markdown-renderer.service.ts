import { Injectable, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Renderer, marked } from 'marked';
import { highlightMarkdownCode } from './markdown-syntax-highlighter';

const DEFAULT_RENDERER = new Renderer();
const MARKDOWN_RENDERER = new Renderer();

MARKDOWN_RENDERER.code = (token): string => {
  const highlighted = highlightMarkdownCode(token.text, token.lang);
  if (highlighted === null) {
    return DEFAULT_RENDERER.code(token).replace('<pre>', '<pre class="markdown-code">');
  }
  return (
    `<pre class="markdown-code"><code class="language-${highlighted.language}">` +
    `${highlighted.html}\n</code></pre>\n`
  );
};

@Injectable({ providedIn: 'root' })
export class MarkdownRendererService {
  private readonly sanitizer = inject(DomSanitizer);

  render(markdown: string): string {
    const html = marked.parse(markdown, { async: false, renderer: MARKDOWN_RENDERER });
    return this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  }
}
