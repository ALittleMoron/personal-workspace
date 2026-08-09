from collections.abc import AsyncIterator

from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from types_aiobotocore_s3.client import S3Client
from valkey.asyncio import Valkey

from core.generators import HexUuidIdGenerator, generate_uuid4_hex
from infra.config.constants import constants
from infra.config.settings import (
    AppSettings,
    DatabaseSettings,
    I18nSettings,
    MinioSettings,
    SentrySettings,
    Settings,
    TaskiqSettings,
    ValkeySettings,
    settings,
)
from infra.healthcheck import ReadinessChecker
from infra.postgresql.meta import create_engine, create_sessionmaker
from infra.s3.clients import create_s3_client_context
from infra.valkey.clients import create_valkey_client


class InfrastructureProvider(Provider):
    @provide(scope=Scope.APP)
    def provide_hex_uuid_id_generator(self) -> HexUuidIdGenerator:
        return HexUuidIdGenerator(generator=generate_uuid4_hex)

    @provide(scope=Scope.APP)
    def provide_settings(self) -> Settings:
        return settings

    @provide(scope=Scope.APP)
    def provide_app_settings(self, project_settings: Settings) -> AppSettings:
        return project_settings.app

    @provide(scope=Scope.APP)
    def provide_database_settings(self, project_settings: Settings) -> DatabaseSettings:
        return project_settings.database

    @provide(scope=Scope.APP)
    def provide_i18n_settings(self, project_settings: Settings) -> I18nSettings:
        return project_settings.i18n

    @provide(scope=Scope.APP)
    def provide_minio_settings(self, project_settings: Settings) -> MinioSettings:
        return project_settings.minio

    @provide(scope=Scope.APP)
    def provide_sentry_settings(self, project_settings: Settings) -> SentrySettings:
        return project_settings.sentry

    @provide(scope=Scope.APP)
    def provide_taskiq_settings(self, project_settings: Settings) -> TaskiqSettings:
        return project_settings.taskiq

    @provide(scope=Scope.APP)
    def provide_valkey_settings(self, project_settings: Settings) -> ValkeySettings:
        return project_settings.valkey

    @provide(scope=Scope.APP)
    async def provide_engine(
        self,
        database_settings: DatabaseSettings,
    ) -> AsyncIterator[AsyncEngine]:
        engine = create_engine(database_settings=database_settings)
        yield engine
        await engine.dispose()

    @provide(scope=Scope.APP)
    def provide_sessionmaker(
        self,
        engine: AsyncEngine,
        database_settings: DatabaseSettings,
    ) -> async_sessionmaker[AsyncSession]:
        return create_sessionmaker(engine=engine, database_settings=database_settings)

    @provide(scope=Scope.REQUEST)
    async def provide_session(
        self,
        session_factory: async_sessionmaker[AsyncSession],
    ) -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            try:
                yield session
            except BaseException:
                await session.rollback()
                raise
            else:
                await session.commit()

    @provide(scope=Scope.APP)
    async def provide_valkey(
        self,
        valkey_settings: ValkeySettings,
    ) -> AsyncIterator[Valkey]:
        client = create_valkey_client(
            valkey_settings=valkey_settings,
            database=constants.valkey_databases.readiness,
        )
        yield client
        await client.aclose()

    @provide(scope=Scope.APP)
    async def provide_s3_client(
        self,
        minio_settings: MinioSettings,
    ) -> AsyncIterator[S3Client]:
        async with create_s3_client_context(minio_settings=minio_settings) as client:
            yield client

    @provide(scope=Scope.REQUEST)
    def provide_readiness_checker(
        self,
        session: AsyncSession,
        valkey: Valkey,
        s3_client: S3Client,
    ) -> ReadinessChecker:
        return ReadinessChecker(session=session, valkey=valkey, s3_client=s3_client)
