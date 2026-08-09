import sentry_sdk
from sentry_sdk.integrations.litestar import LitestarIntegration

from infra.config.settings import SentrySettings


def init_sentry(*, sentry_settings: SentrySettings) -> None:
    if not sentry_settings.use:
        return
    sentry_sdk.init(
        dsn=sentry_settings.dsn.get_secret_value(),
        send_default_pii=False,
        traces_sample_rate=1.0,
        enable_logs=True,
        integrations=[LitestarIntegration()],
    )
