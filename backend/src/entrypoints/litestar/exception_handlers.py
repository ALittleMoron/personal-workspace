from typing import Any

from litestar import Request, Response, status_codes
from verbose_http_exceptions import InternalServerErrorHTTPException, NotFoundHTTPException
from verbose_http_exceptions.exc.base import BaseVerboseHTTPException
from verbose_http_exceptions.ext.litestar import (
    ALL_EXCEPTION_HANDLERS_MAP,
    verbose_http_exception_handler,
)
from verbose_http_exceptions.ext.litestar.types import LitestarExceptionHandlersMap

from core.exceptions import DomainError, EntryNotFoundError
from infra.healthcheck import ReadinessCheckError


def domain_error_handler(request: Request[Any, Any, Any], error: Exception) -> Response[Any]:
    exception: BaseVerboseHTTPException
    if isinstance(error, EntryNotFoundError):
        exception = NotFoundHTTPException(message=error.message)
    elif isinstance(error, DomainError):
        exception = InternalServerErrorHTTPException(message=error.message)
    else:
        exception = InternalServerErrorHTTPException(message="Internal server error")
    return verbose_http_exception_handler(request, exception)


def readiness_error_handler(
    _request: Request[Any, Any, Any],
    _error: Exception,
) -> Response[str]:
    return Response(content="", status_code=status_codes.HTTP_503_SERVICE_UNAVAILABLE)


def get_litestar_exception_handlers() -> LitestarExceptionHandlersMap:
    return {
        **ALL_EXCEPTION_HANDLERS_MAP,
        DomainError: domain_error_handler,
        ReadinessCheckError: readiness_error_handler,
    }
