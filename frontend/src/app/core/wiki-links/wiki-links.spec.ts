import {
  createWikiLinkTargetLookup,
  findMissingWikiLinkTargets,
  parseWikiLink,
  parseWikiLinks,
  renderMarkdownWithWikiLinks,
  replaceWikiLinksWithPlainText,
} from './wiki-links';

describe('wiki links', () => {
  const sanitizeHtml = (html: string): string => html;

  it('does not recognize removed article or competency-matrix targets', () => {
    const markdown = 'Read [[articles:typed-articles]] and [[matrix:angular-forms|Angular forms]].';

    expect(parseWikiLinks(markdown)).toEqual([]);
    expect(parseWikiLink('[[articles:typed-articles]]')).toBeNull();
    expect(
      findMissingWikiLinkTargets({ markdown, availableTargets: createWikiLinkTargetLookup([]) }),
    ).toEqual([]);
  });

  it('does not build links or plain-text replacements for removed target syntax', () => {
    const markdown = 'Read [[articles:typed-articles]] and [[matrix:question|Label]].';
    const html = renderMarkdownWithWikiLinks(markdown, 'en', sanitizeHtml);

    expect(html).toContain('[[articles:typed-articles]]');
    expect(html).toContain('[[matrix:question|Label]]');
    expect(html).not.toContain('/articles/');
    expect(html).not.toContain('/competency-matrix/');
    expect(replaceWikiLinksWithPlainText(markdown)).toBe(markdown);
  });

  it('renders real syntax tokens for multiple supported fenced code blocks', () => {
    const html = renderMarkdownWithWikiLinks(
      [
        '```ts',
        'const answer: number = 42;',
        '```',
        '',
        '```python',
        'def answer():',
        '    return 42',
        '```',
      ].join('\n'),
      'en',
      sanitizeHtml,
    );

    expect(html).toContain('<code class="language-ts">');
    expect(html).toContain('<code class="language-python">');
    expect(html).toContain('<span class="token keyword">const</span>');
    expect(html).toContain('<span class="token keyword">def</span>');
  });

  it.each([
    { language: 'js', code: 'const value = 1;' },
    { language: 'sh', code: 'echo "$HOME"' },
    { language: 'dockerfile', code: 'FROM python:3.14' },
    { language: 'yml', code: 'enabled: true' },
  ])('highlights the $language language alias', ({ language, code }) => {
    const html = renderMarkdownWithWikiLinks(
      `\`\`\`${language}\n${code}\n\`\`\``,
      'en',
      sanitizeHtml,
    );

    expect(html).toContain(`class="language-${language}"`);
    expect(html).toContain('class="token ');
  });

  it.each(['gherkin', 'feature', 'cucumber'])(
    'highlights the %s Gherkin fence language',
    (language) => {
      const html = renderMarkdownWithWikiLinks(
        `\`\`\`${language}\nFeature: Knowledge\n  Scenario: Save a note\n    Given an existing note\n\`\`\``,
        'en',
        sanitizeHtml,
      );

      expect(html).toContain(`<code class="language-${language}">`);
      expect(html).toContain('<span class="token keyword">Feature:</span>');
      expect(html).toContain('<span class="token atrule">Given</span>');
    },
  );

  it('highlights a Go fenced code block', () => {
    const html = renderMarkdownWithWikiLinks('```go\nfunc main() {}\n```', 'en', sanitizeHtml);

    expect(html).toContain('<code class="language-go">');
    expect(html).toContain('<span class="token keyword">func</span>');
    expect(html).toContain('<span class="token function">main</span>');
  });

  it.each(['', 'unknown-language'])(
    'keeps an unsupported "%s" fenced code block as escaped plain code',
    (language) => {
      const html = renderMarkdownWithWikiLinks(
        `\`\`\`${language}\n<script>alert("code")</script>\n\`\`\``,
        'en',
        sanitizeHtml,
      );

      expect(html).toContain('<pre class="markdown-code"><code');
      expect(html).toContain('&lt;script&gt;alert(&quot;code&quot;)&lt;/script&gt;');
      expect(html).not.toContain('<span class="token ');
    },
  );
});
