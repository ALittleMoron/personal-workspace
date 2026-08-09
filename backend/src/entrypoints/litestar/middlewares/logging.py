import uuid

import structlog.contextvars
from litestar.middleware import ASGIMiddleware
from litestar.middleware.logging import LoggingMiddleware
from litestar.types import ASGIApp, Message, Receive, Scope, Send

from infra.config.constants import constants
from infra.config.loggers import log_sanitized_exception


class RequestIdLoggingMiddleware(ASGIMiddleware):
    async def handle(self, scope: Scope, receive: Receive, send: Send, next_app: ASGIApp) -> None:
        request_id = str(uuid.uuid4())
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        async def send_with_request_id(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append(
                    (
                        constants.request_logging.request_id_header.lower().encode(),
                        request_id.encode(),
                    ),
                )
                message["headers"] = headers
            await send(message)

        await next_app(scope, receive, send_with_request_id)


class LogExceptionMiddleware(ASGIMiddleware):
    async def handle(self, scope: Scope, receive: Receive, send: Send, next_app: ASGIApp) -> None:
        try:
            await next_app(scope, receive, send)
        except Exception as error:
            log_sanitized_exception(
                event="Unhandled request exception",
                error=error,
            )
            raise


class PrivacySafeLoggingMiddleware(LoggingMiddleware):
    pass
