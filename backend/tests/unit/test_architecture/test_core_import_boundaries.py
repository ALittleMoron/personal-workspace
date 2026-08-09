import ast
from pathlib import Path

CORE_ROOT = Path(__file__).parents[4] / "src" / "core"


def test_core_imports_only_standard_library_and_core() -> None:
    violations: list[str] = []
    for path in CORE_ROOT.rglob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module:
                if node.level == 0 and not node.module.startswith("core"):
                    top_level = node.module.partition(".")[0]
                    if top_level not in {"abc", "collections", "dataclasses", "enum", "typing"}:
                        violations.append(f"{path}:{node.lineno}:{node.module}")
            elif isinstance(node, ast.Import):
                violations.extend(
                    f"{path}:{node.lineno}:{alias.name}"
                    for alias in node.names
                    if alias.name.partition(".")[0] != "uuid"
                )

    assert violations == []
