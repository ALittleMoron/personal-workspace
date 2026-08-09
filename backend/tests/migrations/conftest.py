from collections.abc import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from infra.config.settings import Settings
from infra.postgresql.utils import downgrade, migrate
from scripts.pytest_databases import validate_test_database_connection


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def migration_engine(test_settings: Settings) -> AsyncGenerator[AsyncEngine]:
    validate_test_database_connection(
        database_name=test_settings.database.name,
        host=test_settings.database.host,
        user=test_settings.database.user,
    )
    engine = create_async_engine(test_settings.database.url.get_secret_value())
    yield engine
    await engine.dispose()


@pytest.fixture
def migrated_foundation(migration_engine: AsyncEngine) -> Generator[None]:
    _ = migration_engine
    migrate(revision="head")
    yield
    downgrade(revision="base")
