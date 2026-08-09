from unittest.mock import AsyncMock

from litestar import Litestar
from litestar.testing import TestClient

from infra.healthcheck import ReadinessCheckError


def test_liveness_does_not_check_dependencies(
    client: TestClient[Litestar],
    readiness_checker: AsyncMock,
) -> None:
    response = client.get("/api/healthcheck")

    assert response.status_code == 200
    readiness_checker.check.assert_not_awaited()


def test_readiness_checks_dependencies(
    client: TestClient[Litestar],
    readiness_checker: AsyncMock,
) -> None:
    response = client.get("/api/healthcheck/ready")

    assert response.status_code == 200
    readiness_checker.check.assert_awaited_once_with()


def test_readiness_failure_returns_service_unavailable(
    client: TestClient[Litestar],
    readiness_checker: AsyncMock,
) -> None:
    readiness_checker.check.side_effect = ReadinessCheckError

    response = client.get("/api/healthcheck/ready")

    assert response.status_code == 503
