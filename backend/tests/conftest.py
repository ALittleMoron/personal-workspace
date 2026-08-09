import os
from collections.abc import Generator, Mapping
from importlib import import_module
from pathlib import Path
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from infra.config.settings import Settings

TEST_ENV_FILE = Path(__file__).parents[2] / ".env.test"
TEST_ENV_PRELOADED_VARIABLE = "PERSONAL_WORKSPACE_TEST_ENV_PRELOADED"


def load_test_environment(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        variable_name, separator, value = line.partition("=")
        if not separator or not variable_name.isidentifier():
            msg = f"Invalid test environment entry: {raw_line}"
            raise ValueError(msg)
        values[variable_name] = value
    return values


def should_load_test_environment(environment: Mapping[str, str]) -> bool:
    return environment.get(TEST_ENV_PRELOADED_VARIABLE) != "1"


if should_load_test_environment(os.environ):
    for variable_name, value in load_test_environment(TEST_ENV_FILE).items():
        os.environ[variable_name] = value


@pytest.fixture(scope="session")
def test_settings(worker_id: str) -> Generator[Settings]:
    settings = import_module("infra.config.settings").settings
    build_worker_database_name = import_module(
        "scripts.pytest_parallel",
    ).build_worker_database_name

    original_database_name = settings.database.name
    settings.database.name = build_worker_database_name(
        base_database_name="personal_workspace_test",
        worker_id=worker_id,
    )
    yield settings
    settings.database.name = original_database_name
