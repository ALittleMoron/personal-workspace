from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncEngine

from infra.postgresql.utils import downgrade


async def application_table_names(engine: AsyncEngine) -> set[str]:
    async with engine.connect() as connection:
        table_names = await connection.run_sync(
            lambda sync_connection: inspect(sync_connection).get_table_names(),
        )
    return set(table_names) - {"alembic_version"}


async def test_initial_migration_is_a_valid_noop(
    migration_engine: AsyncEngine,
    migrated_foundation: None,
) -> None:
    _ = migrated_foundation
    assert await application_table_names(migration_engine) == set()

    downgrade(revision="base")

    assert await application_table_names(migration_engine) == set()
