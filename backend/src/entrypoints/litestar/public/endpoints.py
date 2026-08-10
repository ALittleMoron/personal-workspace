from dishka.integrations.litestar import DishkaRouter
from litestar import Controller, Response, get
from verbose_http_exceptions import status

from entrypoints.litestar.public.discovery import PublicDiscoveryUrls, RobotsTxt, SitemapXml


class PublicDiscoveryController(Controller):
    include_in_schema = False

    @get("/sitemap.xml")
    async def sitemap(
        self,
    ) -> Response:
        sitemap = SitemapXml(
            urls=PublicDiscoveryUrls().build(),
        ).render()
        return Response(
            content=sitemap,
            media_type="application/xml",
            status_code=status.HTTP_200_OK,
        )

    @get("/robots.txt")
    async def robots(self) -> Response:
        return Response(
            content=RobotsTxt().render(),
            media_type="text/plain",
            status_code=status.HTTP_200_OK,
        )


public_router = DishkaRouter(
    "",
    route_handlers=[PublicDiscoveryController],
    include_in_schema=False,
)
