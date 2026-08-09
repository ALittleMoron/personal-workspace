from collections.abc import Generator

import pytest
from litestar import Litestar
from litestar.testing import TestClient

from entrypoints.litestar.initializers.main import create_litestar_app
from entrypoints.litestar.lifespan.main import app_lifespan
from infra.config.settings import Settings
from infra.ioc.container import create_container


@pytest.fixture
def foundation_client(test_settings: Settings) -> Generator[TestClient[Litestar]]:
    container = create_container()
    app = create_litestar_app(
        container=container,
        project_settings=test_settings,
        lifespan=[app_lifespan],
    )
    with TestClient(app) as client:
        yield client


def test_empty_app_exposes_only_foundation_http_paths(
    foundation_client: TestClient[Litestar],
) -> None:
    assert foundation_client.get("/api/healthcheck").status_code == 200
    assert foundation_client.get("/api/i18n/languages").status_code == 200
    assert foundation_client.get("/api/i18n/bundles/ru").status_code == 200
    assert foundation_client.get("/api/items").status_code == 404
