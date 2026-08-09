from dishka import FromDishka
from dishka.integrations.litestar import DishkaRouter
from litestar import Controller, Response, get, status_codes

from infra.healthcheck import ReadinessChecker


class HealthcheckController(Controller):
    path = "/healthcheck"

    @get("", include_in_schema=False)
    async def health(self) -> Response[str]:
        return Response(content="", status_code=status_codes.HTTP_200_OK)

    @get("/ready", include_in_schema=False)
    async def ready(self, checker: FromDishka[ReadinessChecker]) -> Response[str]:
        await checker.check()
        return Response(content="", status_code=status_codes.HTTP_200_OK)


api_router = DishkaRouter("", route_handlers=[HealthcheckController])
