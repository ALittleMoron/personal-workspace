from pathlib import Path
from typing import Literal


class PathConstants:
    src_dir: Path = Path(__file__).resolve().parent.parent.parent
    root_dir: Path = src_dir.parent
    backend_env_file: Path = root_dir / ".env"
    repository_env_file: Path = root_dir.parent / ".env"
    env_file: Path = backend_env_file if backend_env_file.exists() else repository_env_file
    alembic_dir: Path = src_dir / "infra" / "postgresql" / "alembic"


class ValkeyDatabaseConstants:
    readiness: int = 0
    taskiq_broker: int = 1
    taskiq_results: int = 2


class TaskiqConstants:
    queue_name: Literal["personal_workspace_background"] = "personal_workspace_background"
    consumer_group_name: Literal["personal_workspace_background"] = "personal_workspace_background"
    result_prefix: Literal["personal_workspace_taskiq_results"] = (
        "personal_workspace_taskiq_results"
    )


class RequestLoggingConstants:
    request_id_header: Literal["X-Request-ID"] = "X-Request-ID"


class Constants:
    path: PathConstants = PathConstants()
    valkey_databases: ValkeyDatabaseConstants = ValkeyDatabaseConstants()
    taskiq: TaskiqConstants = TaskiqConstants()
    request_logging: RequestLoggingConstants = RequestLoggingConstants()


constants = Constants()
