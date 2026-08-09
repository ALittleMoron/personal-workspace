from dataclasses import dataclass
from typing import NoReturn

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from types_aiobotocore_s3.client import S3Client
from valkey.asyncio import Valkey

from infra.config.loggers import logger


class ReadinessCheckError(Exception):
    pass


@dataclass(kw_only=True, slots=True)
class ReadinessChecker:
    session: AsyncSession
    valkey: Valkey
    s3_client: S3Client

    async def check(self) -> None:
        await self.check_postgresql()
        await self.check_valkey()
        await self.check_minio()

    async def check_postgresql(self) -> None:
        try:
            await self.session.execute(text("SELECT 1"))
        except Exception as error:  # noqa: BLE001
            self.fail(component="postgresql", error=error)

    async def check_valkey(self) -> None:
        try:
            await self.valkey.ping()
        except Exception as error:  # noqa: BLE001
            self.fail(component="valkey", error=error)

    async def check_minio(self) -> None:
        try:
            await self.s3_client.list_buckets()
        except Exception as error:  # noqa: BLE001
            self.fail(component="minio", error=error)

    @staticmethod
    def fail(*, component: str, error: Exception) -> NoReturn:
        logger.warning(
            "Readiness dependency unavailable",
            component=component,
            exception_type=type(error).__name__,
        )
        raise ReadinessCheckError(component) from error
