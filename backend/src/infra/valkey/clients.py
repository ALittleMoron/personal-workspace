from typing import cast

from valkey.asyncio import Valkey

from infra.config.settings import ValkeySettings


def create_valkey_client(*, valkey_settings: ValkeySettings, database: int) -> Valkey:
    return cast(
        "Valkey",
        Valkey.from_url(
            valkey_settings.get_url(database=database).get_secret_value(),
            decode_responses=False,
        ),
    )
