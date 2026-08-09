from collections.abc import AsyncGenerator, Generator
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from dishka import AsyncContainer, Provider, Scope, make_async_container, provide
from dishka.integrations.litestar import LitestarProvider
from litestar import Litestar
from litestar.testing import TestClient

from entrypoints.litestar.initializers.main import create_litestar_app
from infra.config.settings import I18nSettings, settings
from infra.healthcheck import ReadinessChecker


class FoundationTestProvider(Provider):
    def __init__(self, *, readiness_checker: ReadinessChecker) -> None:
        super().__init__()
        self.readiness_checker = readiness_checker

    @provide(scope=Scope.APP)
    def provide_i18n_settings(self) -> I18nSettings:
        return settings.i18n

    @provide(scope=Scope.REQUEST)
    def provide_readiness_checker(self) -> ReadinessChecker:
        return self.readiness_checker


@pytest.fixture
def readiness_checker() -> AsyncMock:
    return AsyncMock(spec=ReadinessChecker)


@pytest_asyncio.fixture
async def container(readiness_checker: ReadinessChecker) -> AsyncGenerator[AsyncContainer]:
    container = make_async_container(
        FoundationTestProvider(readiness_checker=readiness_checker),
        LitestarProvider(),
    )
    yield container
    await container.close()


@pytest.fixture
def app(container: AsyncContainer) -> Litestar:
    return create_litestar_app(
        container=container,
        project_settings=settings,
        lifespan=[],
    )


@pytest.fixture
def client(app: Litestar) -> Generator[TestClient[Litestar]]:
    with TestClient(app) as client:
        yield client
