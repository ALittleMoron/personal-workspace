from collections.abc import Iterable
from dataclasses import dataclass

from core.i18n.enums import LanguageEnum
from infra.config.settings import settings


@dataclass(frozen=True, kw_only=True, slots=True)
class PublicUrl:
    path: str
    updated_at: str | None

    def absolute_url(self) -> str:
        return settings.app.get_url(self.path)

    def localized_variants(self) -> dict[LanguageEnum, str]:
        return {
            language: settings.app.get_url(self.path_for_language(language=language))
            for language in LanguageEnum
        }

    def path_for_language(self, *, language: LanguageEnum) -> str:
        parts = self.path.split("/", maxsplit=2)
        return f"/{language.value}/{parts[2]}"


@dataclass(frozen=True, kw_only=True, slots=True)
class PublicDiscoveryUrls:
    def build(self) -> list[PublicUrl]:
        return [
            PublicUrl(path=f"/{language.value}/{path}", updated_at=None)
            for path in ("how-this-site-is-built", "updates")
            for language in LanguageEnum
        ]


class SitemapXml:
    def __init__(self, urls: Iterable[PublicUrl]) -> None:
        self.urls = urls

    def render(self) -> str:
        entries = "\n".join(self.render_url(url=url) for url in self.urls)
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
            f"{entries}\n"
            "</urlset>\n"
        )

    def render_url(self, *, url: PublicUrl) -> str:
        alternates = "\n".join(
            (
                '    <xhtml:link rel="alternate" '
                f'hreflang="{language.value}" href={self._quoteattr(variant_url)} />'
            )
            for language, variant_url in url.localized_variants().items()
        )
        lastmod = (
            f"\n    <lastmod>{self._escape(url.updated_at)}</lastmod>" if url.updated_at else ""
        )
        return (
            "  <url>\n"
            f"    <loc>{self._escape(url.absolute_url())}</loc>\n"
            f"{alternates}{lastmod}\n"
            "  </url>"
        )

    def _escape(self, value: str) -> str:
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    def _quoteattr(self, value: str) -> str:
        escaped = self._escape(value).replace('"', "&quot;")
        return f'"{escaped}"'


class RobotsTxt:
    def render(self) -> str:
        return (
            "User-agent: *\n"
            "Allow: /ru/\n"
            "Allow: /en/\n"
            "Allow: /sitemap.xml\n"
            "Disallow: /api/\n"
            "Disallow: /how-this-site-is-built\n"
            "Disallow: /updates\n"
            "Disallow: /sitemap\n"
            f"Sitemap: {settings.app.get_url('/sitemap.xml')}\n"
        )
