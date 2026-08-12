import { marked, Renderer } from 'marked';
import { LanguageCode } from '../i18n/i18n.model';
import { highlightMarkdownCode } from '../markdown/markdown-syntax-highlighter';

export const WIKI_LINK_TARGET_TYPES = [] as const;

export type WikiLinkTargetType = (typeof WIKI_LINK_TARGET_TYPES)[number];

export interface WikiLink {
  type: WikiLinkTargetType;
  slug: string;
  label: string;
  raw: string;
}

export interface WikiLinkTargetGroup {
  type: WikiLinkTargetType;
  items: WikiLinkTarget[];
}

export interface WikiLinkTarget {
  slug: string;
  title: string;
  publishStatus: 'Draft' | 'Published';
}

export type WikiLinkTargetLookup = ReadonlyMap<WikiLinkTargetType, ReadonlySet<string>>;

export interface WikiLinkTargetRegistry {
  groups: readonly WikiLinkTargetGroup[];
  lookup: WikiLinkTargetLookup;
}

const DEFAULT_CODE_RENDERER = new Renderer();
const MARKDOWN_RENDERER = new Renderer();

MARKDOWN_RENDERER.code = (token): string => {
  const highlighted = highlightMarkdownCode(token.text, token.lang);
  if (highlighted === null) {
    return withMarkdownCodeClass(DEFAULT_CODE_RENDERER.code(token));
  }

  return (
    `<pre class="markdown-code"><code class="language-${highlighted.language}">` +
    `${highlighted.html}\n</code></pre>\n`
  );
};

export function parseWikiLinks(markdown: string): WikiLink[] {
  void markdown;
  return [];
}

export function parseWikiLink(markdown: string): WikiLink | null {
  const links = parseWikiLinks(markdown);
  return links.length === 1 && links[0].raw === markdown ? links[0] : null;
}

export function createWikiLinkTargetLookup(
  targets: readonly WikiLinkTargetGroup[],
): WikiLinkTargetLookup {
  return new Map(
    targets.map((target) => [target.type, new Set(target.items.map((item) => item.slug))] as const),
  );
}

export function createWikiLinkTargetRegistry(
  groups: readonly WikiLinkTargetGroup[],
): WikiLinkTargetRegistry {
  return {
    groups,
    lookup: createWikiLinkTargetLookup(groups),
  };
}

export function findMissingWikiLinkTargets(params: {
  markdown: string;
  availableTargets: WikiLinkTargetLookup;
}): string[] {
  const missing = new Set<string>();
  for (const link of parseWikiLinks(params.markdown)) {
    if (!params.availableTargets.get(link.type)?.has(link.slug)) {
      missing.add(`${link.type}:${link.slug}`);
    }
  }
  return Array.from(missing);
}

export function renderMarkdownWithWikiLinks(
  markdown: string,
  language: LanguageCode,
  sanitizeHtml: (html: string) => string,
): string {
  void language;
  const html = marked.parse(markdown, { async: false, renderer: MARKDOWN_RENDERER });
  return sanitizeHtml(html);
}

export function replaceWikiLinksWithPlainText(markdown: string): string {
  return markdown;
}

function withMarkdownCodeClass(html: string): string {
  return html.replace('<pre>', '<pre class="markdown-code">');
}
