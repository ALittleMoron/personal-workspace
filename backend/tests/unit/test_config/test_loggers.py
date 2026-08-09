import logging
from unittest.mock import Mock

from infra.config import loggers
from infra.config.loggers import build_project_logging_config


def test_debug_logging_uses_debug_level() -> None:
    config = build_project_logging_config(debug=True)

    assert config.wrapper_class is not None
    assert logging.DEBUG == 10


def test_production_logging_uses_structured_processors() -> None:
    config = build_project_logging_config(debug=False)

    assert config.processors
    assert config.cache_logger_on_first_use is True


def test_sanitized_exception_logging_omits_exception_details(monkeypatch) -> None:
    error_logger = Mock()
    monkeypatch.setattr(loggers, "logger", error_logger)

    loggers.log_sanitized_exception(
        event="Unhandled request exception",
        error=RuntimeError("private request content"),
    )

    error_logger.error.assert_called_once_with(
        "Unhandled request exception",
        exception_type="RuntimeError",
    )
