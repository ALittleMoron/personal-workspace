from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from litestar import Litestar

from infra.config.initializers import init_sentry
from infra.config.settings import settings


@asynccontextmanager
async def app_lifespan(app: Litestar) -> AsyncGenerator[None]:
    init_sentry(sentry_settings=settings.sentry)
    yield
    await app.state.dishka_container.close()
