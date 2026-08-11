from dataclasses import dataclass

from dishka import AsyncContainer
from litestar.middleware import DefineMiddleware
from litestar.testing import TestClient
from litestar.types import ASGIApp, Receive, Scope, Send
from verbose_http_exceptions import status

from tests.unit.conftest import build_test_app


@dataclass(frozen=True, slots=True, kw_only=True)
class UnverifiedTestIdentity:
    username: str


class UnverifiedIdentityMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        scope["user"] = UnverifiedTestIdentity(username="test")
        scope["auth"] = "unverified-test-identity"
        await self.app(scope, receive, send)


def test_admin_api_rejects_request_without_verified_identity(
    container: AsyncContainer,
) -> None:
    app = build_test_app(container=container, extra_middlewares=[])

    with TestClient(app) as client:
        response = client.get("/api/admin/tools/cache")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_admin_api_rejects_unverified_scope_identity(container: AsyncContainer) -> None:
    app = build_test_app(
        container=container,
        extra_middlewares=[DefineMiddleware(UnverifiedIdentityMiddleware)],
    )

    with TestClient(app) as client:
        response = client.get("/api/admin/tools/cache")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
