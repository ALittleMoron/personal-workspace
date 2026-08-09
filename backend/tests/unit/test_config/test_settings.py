import pytest
from pydantic import ValidationError

from core.i18n.enums import LanguageEnum
from infra.config.settings import (
    DatabaseSettings,
    I18nSettings,
    SecretStrExtended,
    SentrySettings,
)


def create_database_settings() -> DatabaseSettings:
    return DatabaseSettings(
        driver="postgresql+psycopg",
        host="localhost",
        port=55432,
        name="personal_workspace_test",
        user="personal_workspace_test",
        password=SecretStrExtended("personal_workspace_test_password"),
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        expire_on_commit=False,
        log_query_metrics=False,
        slow_query_log_threshold_ms=250,
        slow_query_log_statement_max_length=1000,
    )


def test_database_url_contains_encoded_connection_values() -> None:
    url = create_database_settings().url.get_secret_value()

    assert url.startswith("postgresql+psycopg://personal_workspace_test:")
    assert url.endswith("@localhost:55432/personal_workspace_test")


def test_secrets_are_redacted() -> None:
    secret = SecretStrExtended("private")

    assert "private" not in str(secret)
    assert secret.get_secret_value() == "private"


def test_default_language_is_typed() -> None:
    i18n_settings = I18nSettings(default_language=LanguageEnum.RU)

    assert i18n_settings.default_language is LanguageEnum.RU


def test_unsupported_default_language_is_rejected() -> None:
    with pytest.raises(ValidationError):
        I18nSettings(default_language="de")  # type: ignore[arg-type]


def test_sentry_dsn_may_be_empty_when_sentry_is_disabled() -> None:
    sentry_settings = SentrySettings(use=False, dsn=SecretStrExtended(""))

    assert sentry_settings.dsn.get_secret_value() == ""


@pytest.mark.parametrize("dsn", ["", "   "])
def test_sentry_requires_nonempty_dsn_when_enabled(dsn: str) -> None:
    with pytest.raises(ValidationError, match="SENTRY_DSN must not be empty"):
        SentrySettings(use=True, dsn=SecretStrExtended(dsn))
