from litestar import Router

from entrypoints.litestar.api.admin_tools.endpoints import admin_router as admin_tools_router
from entrypoints.litestar.api.calendar.endpoints import admin_router as calendar_admin_router
from entrypoints.litestar.api.files.endpoints import admin_router as files_admin_router
from entrypoints.litestar.api.healthcheck.endpoints import api_router as healthcheck_router
from entrypoints.litestar.api.i18n.endpoints import api_router as i18n_router
from entrypoints.litestar.api.knowledge.router import admin_router as knowledge_admin_router
from entrypoints.litestar.api.resumes.endpoints import admin_router as resumes_admin_router
from entrypoints.litestar.api.wiki_links.endpoints import admin_router as wiki_links_admin_router

admin_api_router = Router(
    "/admin",
    route_handlers=[
        admin_tools_router,
        calendar_admin_router,
        files_admin_router,
        resumes_admin_router,
        knowledge_admin_router,
        wiki_links_admin_router,
    ],
    tags=["admin api"],
    include_in_schema=False,
)

api_router = Router(
    "/api",
    route_handlers=[
        healthcheck_router,
        i18n_router,
        admin_api_router,
    ],
    tags=["api"],
)
