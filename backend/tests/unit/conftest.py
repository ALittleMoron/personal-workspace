import uuid
from collections.abc import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from dishka import AsyncContainer, make_async_container
from dishka.integrations.litestar import LitestarProvider, setup_dishka
from litestar import Litestar
from litestar.testing import TestClient

from entrypoints.litestar.initializers.main import create_litestar_app
from infra.ioc.prodivers.database_provider import DatabaseProvider
from tests.unit.mocks.providers.cache_tools import MockCacheToolsProvider
from tests.unit.mocks.providers.calendar import MockCalendarProvider
from tests.unit.mocks.providers.files import MockFilesProvider
from tests.unit.mocks.providers.general import MockGeneralProvider
from tests.unit.mocks.providers.healthcheck import MockHealthcheckProvider
from tests.unit.mocks.providers.knowledge import MockKnowledgeProvider
from tests.unit.mocks.providers.resumes import MockResumesProvider
from tests.unit.mocks.providers.wiki_links import MockWikiLinksProvider


@pytest.fixture
def random_suffix(global_random_uuid: uuid.UUID) -> str:
    return global_random_uuid.hex[:8]


@pytest_asyncio.fixture(loop_scope="function")
async def container(
    global_random_uuid: uuid.UUID,
    global_random_hex_uuid: str,
    random_suffix: str,
) -> AsyncGenerator[AsyncContainer]:
    container = make_async_container(
        LitestarProvider(),
        DatabaseProvider(),
        MockGeneralProvider(uuid_=global_random_uuid, hex_uuid=global_random_hex_uuid),
        MockFilesProvider(random_suffix=random_suffix),
        MockCalendarProvider(),
        MockKnowledgeProvider(),
        MockResumesProvider(),
        MockCacheToolsProvider(),
        MockWikiLinksProvider(),
        MockHealthcheckProvider(),
    )
    yield container
    await container.close()


@pytest.fixture
def app(container: AsyncContainer) -> Litestar:
    return build_test_app(container=container)


def build_test_app(container: AsyncContainer) -> Litestar:
    test_app = create_litestar_app(
        lifespan=[], container=container, extra_plugins=[], extra_middlewares=[]
    )
    setup_dishka(container=container, app=test_app)
    return test_app


@pytest.fixture
def client(app: Litestar) -> Generator[TestClient]:
    with TestClient(app) as client:
        yield client
