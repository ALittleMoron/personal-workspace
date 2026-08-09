import ast
from pathlib import Path

BACKEND_ROOT = Path(__file__).parents[4]


def test_only_foundation_route_modules_exist() -> None:
    route_root = BACKEND_ROOT / "src" / "entrypoints" / "litestar" / "api"
    endpoint_modules = {
        path.relative_to(route_root).as_posix() for path in route_root.rglob("endpoints.py")
    }

    assert endpoint_modules == {"healthcheck/endpoints.py", "i18n/endpoints.py"}


def test_taskiq_worker_imports_no_task_modules() -> None:
    worker_path = BACKEND_ROOT / "src" / "entrypoints" / "taskiq" / "worker.py"
    tree = ast.parse(worker_path.read_text(encoding="utf-8"))
    imports = {
        node.module
        for node in ast.walk(tree)
        if isinstance(node, ast.ImportFrom) and node.module is not None
    }

    assert not any(module.endswith("tasks") or ".tasks" in module for module in imports)


def test_only_target_owned_initial_migration_exists() -> None:
    versions = BACKEND_ROOT / "src" / "infra" / "postgresql" / "alembic" / "versions"
    migrations = sorted(path.name for path in versions.glob("*.py") if path.name != "__init__.py")

    assert migrations == ["0001_initial_schema.py"]
