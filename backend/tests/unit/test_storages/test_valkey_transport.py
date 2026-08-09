from unittest.mock import patch

from infra.config.settings import settings
from infra.valkey.clients import create_valkey_client


def test_valkey_transport_uses_selected_database() -> None:
    with patch("infra.valkey.clients.Valkey.from_url") as from_url:
        client = create_valkey_client(valkey_settings=settings.valkey, database=7)

    assert client is from_url.return_value
    from_url.assert_called_once_with("valkey://localhost:6379/7", decode_responses=False)
