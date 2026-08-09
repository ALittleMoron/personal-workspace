from litestar import Litestar
from litestar.testing import TestClient


def test_lists_ru_and_en_languages(client: TestClient[Litestar]) -> None:
    response = client.get("/api/i18n/languages")

    assert response.status_code == 200
    assert response.json() == {
        "defaultLanguage": "ru",
        "languages": [
            {"code": "ru", "label": "Русский"},
            {"code": "en", "label": "English"},
        ],
    }


def test_returns_language_bundle(client: TestClient[Litestar]) -> None:
    response = client.get("/api/i18n/bundles/en")

    assert response.status_code == 200
    assert response.json()["language"] == "en"
    assert response.json()["messages"]["app.name"] == "Personal Workspace"


def test_rejects_unsupported_language(client: TestClient[Litestar]) -> None:
    response = client.get("/api/i18n/bundles/de")

    assert response.status_code == 400
