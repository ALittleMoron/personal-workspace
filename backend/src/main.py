from litestar import Litestar

from entrypoints.litestar.initializers.main import create_litestar_app
from entrypoints.litestar.lifespan.main import app_lifespan
from infra.config.settings import settings
from infra.ioc.container import create_container


def create_app() -> Litestar:
    return create_litestar_app(
        container=create_container(),
        project_settings=settings,
        lifespan=[app_lifespan],
    )
