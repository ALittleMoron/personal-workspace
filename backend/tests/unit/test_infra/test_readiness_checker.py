from typing import cast
from unittest.mock import AsyncMock

import pytest

from infra.healthcheck import ReadinessChecker, ReadinessCheckError


@pytest.fixture
def checker() -> ReadinessChecker:
    return ReadinessChecker(
        session=AsyncMock(),
        valkey=AsyncMock(),
        s3_client=AsyncMock(),
    )


async def test_checks_all_dependencies(checker: ReadinessChecker) -> None:
    await checker.check()

    cast("AsyncMock", checker.session.execute).assert_awaited_once()
    cast("AsyncMock", checker.valkey.ping).assert_awaited_once_with()
    cast("AsyncMock", checker.s3_client.list_buckets).assert_awaited_once_with()


@pytest.mark.parametrize("component", ["session", "valkey", "s3_client"])
async def test_wraps_dependency_errors(checker: ReadinessChecker, component: str) -> None:
    operation_name = {
        "session": "execute",
        "valkey": "ping",
        "s3_client": "list_buckets",
    }[component]
    getattr(getattr(checker, component), operation_name).side_effect = RuntimeError("private")

    with pytest.raises(ReadinessCheckError):
        await checker.check()
