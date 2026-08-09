import pytest

from scripts.pytest_databases import (
    validate_test_database_connection,
    validate_test_database_name,
)


@pytest.mark.parametrize(
    "database_name",
    [
        "personal_workspace_test",
        "personal_workspace_test_gw0",
        "personal_workspace_test_template_abcd1234",
    ],
)
def test_allows_test_database_names(database_name: str) -> None:
    validate_test_database_name(database_name)


@pytest.mark.parametrize(
    "database_name",
    [
        "postgres",
        "personal_workspace",
        "production_test",
        "other_test",
        "personal_workspace_test_backup",
        "personal_workspace_test_gw",
        "personal_workspace_test_gwA",
        "personal_workspace_test_template_nothex",
        "personal_workspace_test_template_abcdef0123",
    ],
)
def test_rejects_non_test_database_names(database_name: str) -> None:
    with pytest.raises(ValueError, match="Refusing to manage non-test database"):
        validate_test_database_name(database_name)


@pytest.mark.parametrize("host", ["localhost", "127.0.0.1"])
def test_allows_target_owned_local_connection(host: str) -> None:
    validate_test_database_connection(
        database_name="personal_workspace_test",
        host=host,
        user="personal_workspace_test",
    )


@pytest.mark.parametrize("host", ["postgres", "database.internal", "10.0.0.8"])
def test_rejects_nonlocal_database_host(host: str) -> None:
    with pytest.raises(ValueError, match="Refusing to manage a test database on host"):
        validate_test_database_connection(
            database_name="personal_workspace_test",
            host=host,
            user="personal_workspace_test",
        )


@pytest.mark.parametrize("user", ["postgres", "personal_workspace", "root"])
def test_rejects_non_test_database_user(user: str) -> None:
    with pytest.raises(ValueError, match="Refusing to manage a test database as user"):
        validate_test_database_connection(
            database_name="personal_workspace_test",
            host="localhost",
            user=user,
        )
