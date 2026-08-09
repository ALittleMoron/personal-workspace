from typing import cast

import pytest
from sqlalchemy.engine import Connection
from sqlalchemy.engine.interfaces import ExceptionContext

from infra.postgresql.query_monitoring import (
    build_slow_query_log_payload,
    clear_failed_query_timer,
    get_query_start_times,
    is_slow_query,
    normalize_sql_statement,
)


class ConnectionStub:
    def __init__(self) -> None:
        self.info: dict[str, object] = {}


class ExceptionContextStub:
    def __init__(self, *, connection: Connection | None) -> None:
        self.connection = connection


def test_normalizes_and_truncates_sql_without_parameters() -> None:
    statement = normalize_sql_statement("SELECT  *\nFROM entries WHERE id = %s", 20)

    assert statement == "SELECT * FROM ent..."


def test_rejects_unsafe_statement_limit() -> None:
    with pytest.raises(ValueError, match="at least 4"):
        normalize_sql_statement("SELECT 1", 3)


def test_builds_slow_query_payload() -> None:
    assert is_slow_query(duration_ms=10.0, threshold_ms=10)
    assert build_slow_query_log_payload(
        statement="SELECT 1",
        duration_ms=10.125,
        threshold_ms=10,
        statement_max_length=100,
        executemany=False,
    ) == {
        "duration_ms": 10.12,
        "threshold_ms": 10,
        "statement": "SELECT 1",
        "executemany": False,
    }


def test_failed_query_clears_its_start_timer() -> None:
    connection = cast("Connection", ConnectionStub())
    get_query_start_times(conn=connection).append(123)
    exception_context = cast(
        "ExceptionContext",
        ExceptionContextStub(connection=connection),
    )

    clear_failed_query_timer(exception_context)

    assert get_query_start_times(conn=connection) == []


def test_connection_failure_without_connection_needs_no_timer_cleanup() -> None:
    exception_context = cast(
        "ExceptionContext",
        ExceptionContextStub(connection=None),
    )

    clear_failed_query_timer(exception_context)
