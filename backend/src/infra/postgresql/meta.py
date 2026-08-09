from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from infra.config.settings import DatabaseSettings
from infra.postgresql.query_monitoring import install_query_monitoring

metadata = MetaData()


def create_engine(*, database_settings: DatabaseSettings) -> AsyncEngine:
    engine = create_async_engine(
        database_settings.url.get_secret_value(),
        pool_pre_ping=database_settings.pool_pre_ping,
        pool_size=database_settings.pool_size,
        max_overflow=database_settings.max_overflow,
    )
    install_query_monitoring(
        engine=engine,
        enabled=database_settings.log_query_metrics,
        slow_query_log_threshold_ms=database_settings.slow_query_log_threshold_ms,
        statement_max_length=database_settings.slow_query_log_statement_max_length,
    )
    return engine


def create_sessionmaker(
    *,
    engine: AsyncEngine,
    database_settings: DatabaseSettings,
) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=database_settings.expire_on_commit,
    )
