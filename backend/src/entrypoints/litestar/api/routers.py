from litestar import Router

from entrypoints.litestar.api.healthcheck.endpoints import api_router as healthcheck_router
from entrypoints.litestar.api.i18n.endpoints import api_router as i18n_router

api_router = Router(
    "/api",
    route_handlers=[healthcheck_router, i18n_router],
    tags=["api"],
)
