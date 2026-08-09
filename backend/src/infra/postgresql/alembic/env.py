from collections.abc import Iterable
from logging.config import fileConfig
from typing import TYPE_CHECKING, TypeAlias

from alembic import context
from sqlalchemy import engine_from_config, pool

from infra.config.settings import settings
from infra.postgresql.meta import metadata

if TYPE_CHECKING:
    from alembic.operations.ops import MigrationScript
    from alembic.runtime.migration import MigrationContext

    RevisionType: TypeAlias = str | Iterable[str | None] | Iterable[str]

config = context.config
config.set_main_option("sqlalchemy.url", settings.database.url.get_secret_value())
target_metadata = metadata

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def process_revision_directives(
    migration_context: "MigrationContext",
    _revision: "RevisionType",
    directives: list["MigrationScript"],
) -> None:
    migration_script = directives[0]
    head_revision = migration_context.get_current_revision()
    new_revision = int(head_revision) + 1 if head_revision else 1
    migration_script.rev_id = f"{new_revision:04}"


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            process_revision_directives=process_revision_directives,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
