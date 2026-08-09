import os
from collections.abc import Generator
from hashlib import sha1

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, Connection, Engine
from sqlalchemy.pool import NullPool

from infra.config.settings import Settings
from infra.postgresql.utils import migrate
from scripts.pytest_databases import (
    validate_test_database_connection,
    validate_test_database_name,
)
from scripts.pytest_parallel import build_template_database_name, quote_postgresql_identifier

BASE_TEST_DATABASE_NAME = "personal_workspace_test"
TEMPLATE_DATABASE_RUN_ID_ENV = "BACKEND_PYTEST_DB_TEMPLATE_ID"


@pytest.fixture(scope="session", autouse=True)
def worker_database(
    test_settings: Settings,
    worker_id: str,
    testrun_uid: str,
) -> Generator[None]:
    validate_test_database_connection(
        database_name=test_settings.database.name,
        host=test_settings.database.host,
        user=test_settings.database.user,
    )
    if worker_id == "master":
        yield
        return

    database_name = test_settings.database.name
    template_database_name = build_template_database_name(
        base_database_name=BASE_TEST_DATABASE_NAME,
        run_id=os.environ.get(TEMPLATE_DATABASE_RUN_ID_ENV, testrun_uid),
    )
    engine = create_engine(
        maintenance_database_url(test_settings=test_settings),
        isolation_level="AUTOCOMMIT",
        poolclass=NullPool,
    )
    try:
        ensure_template_database(
            engine=engine,
            template_database_name=template_database_name,
            test_settings=test_settings,
        )
        drop_database(engine=engine, database_name=database_name)
        create_database_from_template(
            engine=engine,
            database_name=database_name,
            template_database_name=template_database_name,
        )
        yield
    finally:
        drop_database(engine=engine, database_name=database_name)
        engine.dispose()


def maintenance_database_url(*, test_settings: Settings) -> URL:
    return URL.create(
        drivername=test_settings.database.driver,
        username=test_settings.database.user,
        password=test_settings.database.password.get_secret_value(),
        host=test_settings.database.host,
        port=test_settings.database.port,
        database="postgres",
    )


def ensure_template_database(
    *,
    engine: Engine,
    template_database_name: str,
    test_settings: Settings,
) -> None:
    validate_test_database_name(template_database_name)
    lock_id = template_database_lock_id(template_database_name=template_database_name)
    with engine.connect() as connection:
        connection.execute(text("SELECT pg_advisory_lock(:lock_id)"), {"lock_id": lock_id})
        try:
            if database_exists(connection=connection, database_name=template_database_name):
                return
            connection.execute(
                text(f"CREATE DATABASE {quote_postgresql_identifier(template_database_name)}"),
            )
            migrate_template_database(
                test_settings=test_settings,
                template_database_name=template_database_name,
            )
        finally:
            connection.execute(text("SELECT pg_advisory_unlock(:lock_id)"), {"lock_id": lock_id})


def create_database_from_template(
    *,
    engine: Engine,
    database_name: str,
    template_database_name: str,
) -> None:
    validate_test_database_name(database_name)
    validate_test_database_name(template_database_name)
    with engine.connect() as connection:
        connection.execute(
            text(
                f"CREATE DATABASE {quote_postgresql_identifier(database_name)} "
                f"TEMPLATE {quote_postgresql_identifier(template_database_name)}",
            ),
        )


def drop_database(*, engine: Engine, database_name: str) -> None:
    validate_test_database_name(database_name)
    with engine.connect() as connection:
        connection.execute(
            text(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                "WHERE datname = :database_name AND pid <> pg_backend_pid()",
            ),
            {"database_name": database_name},
        )
        connection.execute(
            text(f"DROP DATABASE IF EXISTS {quote_postgresql_identifier(database_name)}"),
        )


def database_exists(*, connection: Connection, database_name: str) -> bool:
    result = connection.execute(
        text("SELECT 1 FROM pg_database WHERE datname = :database_name"),
        {"database_name": database_name},
    )
    return result.scalar_one_or_none() is not None


def migrate_template_database(*, test_settings: Settings, template_database_name: str) -> None:
    original_database_name = test_settings.database.name
    test_settings.database.name = template_database_name
    try:
        migrate(revision="head")
    finally:
        test_settings.database.name = original_database_name


def template_database_lock_id(*, template_database_name: str) -> int:
    digest = sha1(
        f"pytest-template-db:{template_database_name}".encode(),
        usedforsecurity=False,
    ).digest()
    return int.from_bytes(digest[:8], byteorder="big") % ((2**63) - 1)
