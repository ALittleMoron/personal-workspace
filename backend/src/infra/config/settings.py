from ipaddress import IPv4Address
from typing import Literal, Self

from pydantic import PositiveInt, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL

from core.i18n.enums import LanguageEnum
from core.schemas import Secret
from infra.config.constants import constants

LOCAL_ALL_INTERFACES_HOST = IPv4Address(0).compressed


class ProjectBaseSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=constants.path.env_file, extra="ignore")


class SecretStrExtended(SecretStr):
    def to_domain_secret(self) -> Secret[str]:
        return Secret(self.get_secret_value())


class DatabaseSettings(ProjectBaseSettings):
    model_config = SettingsConfigDict(env_prefix="DB_")

    driver: str
    host: str
    port: int
    name: str
    user: str
    password: SecretStrExtended
    pool_pre_ping: bool
    pool_size: PositiveInt
    max_overflow: int
    expire_on_commit: bool
    log_query_metrics: bool
    slow_query_log_threshold_ms: int
    slow_query_log_statement_max_length: PositiveInt

    @property
    def url(self) -> SecretStrExtended:
        url = URL.create(
            drivername=self.driver,
            username=self.user,
            password=self.password.get_secret_value(),
            host=self.host,
            port=self.port,
            database=self.name,
        )
        return SecretStrExtended(url.render_as_string(hide_password=False))


class AppSettings(ProjectBaseSettings):
    model_config = SettingsConfigDict(env_prefix="APP_")

    debug: bool
    domain: str
    url_schema: Literal["http", "https"]

    @property
    def is_local_domain(self) -> bool:
        return self.domain in {"localhost", "127.0.0.1", LOCAL_ALL_INTERFACES_HOST}

    @property
    def base_url(self) -> str:
        port = ":8000" if self.debug and self.is_local_domain else ""
        return f"{self.url_schema}://{self.domain}{port}"


class MinioSettings(ProjectBaseSettings):
    model_config = SettingsConfigDict(env_prefix="MINIO_")

    host: str
    port: int
    secure: bool
    region: str
    access_key: SecretStrExtended
    secret_key: SecretStrExtended

    @property
    def endpoint_url(self) -> str:
        schema = "https" if self.secure else "http"
        return f"{schema}://{self.host}:{self.port}"


class ValkeySettings(ProjectBaseSettings):
    model_config = SettingsConfigDict(env_prefix="VALKEY_")

    host: str
    port: int

    def get_url(self, *, database: int) -> SecretStrExtended:
        return SecretStrExtended(f"valkey://{self.host}:{self.port}/{database}")


class TaskiqSettings(ProjectBaseSettings):
    model_config = SettingsConfigDict(env_prefix="TASKIQ_")

    result_expire_seconds: PositiveInt


class SentrySettings(ProjectBaseSettings):
    model_config = SettingsConfigDict(env_prefix="SENTRY_")

    use: bool
    dsn: SecretStrExtended

    @model_validator(mode="after")
    def validate_enabled_dsn(self) -> Self:
        if self.use and not self.dsn.get_secret_value().strip():
            msg = "SENTRY_DSN must not be empty when SENTRY_USE is enabled"
            raise ValueError(msg)
        return self


class I18nSettings(ProjectBaseSettings):
    model_config = SettingsConfigDict(env_prefix="I18N_")

    default_language: LanguageEnum


class Settings:
    app: AppSettings
    database: DatabaseSettings
    i18n: I18nSettings
    minio: MinioSettings
    sentry: SentrySettings
    taskiq: TaskiqSettings
    valkey: ValkeySettings

    def __init__(self) -> None:
        self.app = AppSettings()
        self.database = DatabaseSettings()
        self.i18n = I18nSettings()
        self.minio = MinioSettings()
        self.sentry = SentrySettings()
        self.taskiq = TaskiqSettings()
        self.valkey = ValkeySettings()


settings = Settings()
