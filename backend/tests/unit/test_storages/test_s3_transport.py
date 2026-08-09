from collections.abc import Mapping
from typing import Any
from unittest.mock import Mock

from infra.config.settings import settings
from infra.s3.clients import create_s3_client_context


class RecordingS3Session:
    def __init__(self) -> None:
        self.create_client = Mock(return_value=object())


def test_s3_transport_uses_private_minio_endpoint_and_credentials() -> None:
    session = RecordingS3Session()

    context = create_s3_client_context(
        minio_settings=settings.minio,
        session=session,
    )

    assert context is session.create_client.return_value
    kwargs: Mapping[str, Any] = session.create_client.call_args.kwargs
    assert kwargs["endpoint_url"] == "http://localhost:9000"
    assert kwargs["aws_access_key_id"] == "personal_workspace_test_access_key"
    assert kwargs["aws_secret_access_key"] == settings.minio.secret_key.get_secret_value()
