from tests.conftest import (
    TEST_ENV_PRELOADED_VARIABLE,
    should_load_test_environment,
)


def test_direct_pytest_loads_deterministic_environment() -> None:
    assert should_load_test_environment({}) is True


def test_script_preload_preserves_authoritative_overrides() -> None:
    environment = {
        TEST_ENV_PRELOADED_VARIABLE: "1",
        "DB_PORT": "65432",
    }

    assert should_load_test_environment(environment) is False


def test_invalid_preload_marker_does_not_skip_deterministic_environment() -> None:
    assert should_load_test_environment({TEST_ENV_PRELOADED_VARIABLE: "true"}) is True
