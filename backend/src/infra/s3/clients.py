from contextlib import AbstractAsyncContextManager
from typing import cast

from aiobotocore.session import AioSession, get_session
from types_aiobotocore_s3.client import S3Client

from infra.config.settings import MinioSettings


def create_s3_client_context(
    *,
    minio_settings: MinioSettings,
    session: AioSession | None = None,
) -> AbstractAsyncContextManager[S3Client]:
    client_context = (session or get_session()).create_client(
        "s3",
        endpoint_url=minio_settings.endpoint_url,
        region_name=minio_settings.region,
        aws_access_key_id=minio_settings.access_key.get_secret_value(),
        aws_secret_access_key=minio_settings.secret_key.get_secret_value(),
    )
    return cast("AbstractAsyncContextManager[S3Client]", client_context)
