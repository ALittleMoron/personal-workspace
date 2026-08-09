from pathlib import Path

from entrypoints.taskiq.broker import broker
from infra.config.constants import constants


def test_broker_uses_target_owned_names() -> None:
    assert broker is not None
    assert constants.taskiq.queue_name == "personal_workspace_background"
    assert constants.taskiq.consumer_group_name == "personal_workspace_background"
    assert constants.taskiq.result_prefix == "personal_workspace_taskiq_results"


def test_worker_is_an_empty_registry_entrypoint() -> None:
    worker = Path(__file__).parents[3] / "src" / "entrypoints" / "taskiq" / "worker.py"
    source = worker.read_text(encoding="utf-8")

    assert "TaskiqScheduler" in source
    assert "tasks" not in source
