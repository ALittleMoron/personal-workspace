from collections.abc import Callable, Sequence
from contextlib import AbstractAsyncContextManager

from dishka import AsyncContainer
from dishka.integrations.litestar import setup_dishka
from litestar import Litestar
from litestar.logging import StructLoggingConfig
from litestar.middleware.logging import LoggingMiddlewareConfig
from litestar.openapi import OpenAPIConfig
from litestar.openapi.plugins import SwaggerRenderPlugin
from litestar.plugins import PluginProtocol
from litestar.plugins.pydantic import PydanticPlugin
from litestar.plugins.structlog import StructlogConfig, StructlogPlugin

from entrypoints.litestar.api.routers import api_router
from entrypoints.litestar.exception_handlers import get_litestar_exception_handlers
from entrypoints.litestar.middlewares.logging import (
    LogExceptionMiddleware,
    PrivacySafeLoggingMiddleware,
    RequestIdLoggingMiddleware,
)
from infra.config import loggers
from infra.config.settings import Settings

Lifespan = Sequence[
    Callable[[Litestar], AbstractAsyncContextManager[None]] | AbstractAsyncContextManager[None]
]


def create_openapi_config() -> OpenAPIConfig:
    return OpenAPIConfig(
        title="Personal Workspace API",
        version="0.1.0",
        path="/api/docs",
        render_plugins=[SwaggerRenderPlugin()],
    )


def create_plugins(*, debug: bool) -> list[PluginProtocol]:
    logging_config = create_structlog_logging_config(debug=debug)
    return [
        StructlogPlugin(
            config=StructlogConfig(
                structlog_logging_config=logging_config,
                middleware_logging_config=LoggingMiddlewareConfig(
                    request_log_fields=["path", "method", "path_params"],
                    response_log_fields=["status_code"],
                    middleware_class=PrivacySafeLoggingMiddleware,
                ),
            ),
        ),
        PydanticPlugin(prefer_alias=True),
    ]


def create_structlog_logging_config(*, debug: bool) -> StructLoggingConfig:
    project_logging_config = loggers.build_project_logging_config(debug=debug)
    return StructLoggingConfig(
        log_exceptions="never",
        processors=project_logging_config.processors,
        wrapper_class=project_logging_config.wrapper_class,
        logger_factory=project_logging_config.logger_factory,
        cache_logger_on_first_use=project_logging_config.cache_logger_on_first_use,
    )


def create_litestar_app(
    *,
    container: AsyncContainer,
    project_settings: Settings,
    lifespan: Lifespan,
) -> Litestar:
    loggers.configure_project_logging(debug=project_settings.app.debug)
    app = Litestar(
        route_handlers=[api_router],
        lifespan=lifespan,
        debug=project_settings.app.debug,
        exception_handlers=get_litestar_exception_handlers(),
        middleware=[RequestIdLoggingMiddleware(), LogExceptionMiddleware()],
        plugins=create_plugins(debug=project_settings.app.debug),
        openapi_config=create_openapi_config(),
    )
    setup_dishka(container=container, app=app)
    return app
