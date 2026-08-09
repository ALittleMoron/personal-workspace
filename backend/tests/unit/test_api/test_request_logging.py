import uuid
from typing import cast
from unittest.mock import Mock

import pytest
from litestar import Litestar
from litestar.testing import TestClient
from litestar.types import ASGIApp, Message, Receive, Scope, Send

from entrypoints.litestar.initializers.main import create_structlog_logging_config
from entrypoints.litestar.middlewares import logging as logging_middleware
from entrypoints.litestar.middlewares.logging import LogExceptionMiddleware


def test_response_contains_opaque_request_id(client: TestClient[Litestar]) -> None:
    response = client.get("/api/healthcheck?private=value", headers={"Authorization": "secret"})

    assert uuid.UUID(response.headers["x-request-id"])


def test_framework_exception_logging_is_disabled() -> None:
    logging_config = create_structlog_logging_config(debug=True)

    assert logging_config.log_exceptions == "never"


@pytest.mark.asyncio
async def test_unhandled_request_error_uses_only_sanitized_logging(monkeypatch) -> None:
    error = RuntimeError("private request content")
    sanitized_logger = Mock()
    monkeypatch.setattr(logging_middleware, "log_sanitized_exception", sanitized_logger)

    async def receive() -> Message:
        return {"type": "http.request"}

    async def send(_message: Message) -> None:
        return None

    async def next_app(_scope: Scope, _receive: Receive, _send: Send) -> None:
        raise error

    middleware = LogExceptionMiddleware()
    scope = cast(Scope, {"type": "http"})

    with pytest.raises(RuntimeError, match="private request content"):
        await middleware.handle(scope, receive, send, cast(ASGIApp, next_app))

    sanitized_logger.assert_called_once_with(event="Unhandled request exception", error=error)
