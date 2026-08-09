#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import re
import shlex
import stat
import sys
import tempfile
import unicodedata
from pathlib import Path


VARIABLE_NAME_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]*$")
RUNTIME_ENV_LOADED = "PERSONAL_WORKSPACE_RUNTIME_ENV_LOADED"


def reject_control_characters(value: str, *, context: str) -> None:
    for character in value:
        if unicodedata.category(character) == "Cc":
            raise ValueError(f"{context} contains an unsupported control character.")


def parse_runtime_env(path: Path) -> dict[str, str]:
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError(f"{path} must be valid UTF-8.") from exc
    if "\r" in text:
        raise ValueError(f"{path} must use LF line endings.")

    values: dict[str, str] = {}
    for line_number, line in enumerate(text.split("\n"), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        reject_control_characters(line, context=f"{path}:{line_number}")
        try:
            tokens = shlex.split(line, comments=False, posix=True)
        except ValueError as exc:
            raise ValueError(f"{path}:{line_number}: {exc}") from exc
        if len(tokens) != 1 or "=" not in tokens[0]:
            raise ValueError(f"{path}:{line_number} must contain one shell-quoted NAME=value.")

        name, value = tokens[0].split("=", 1)
        if VARIABLE_NAME_PATTERN.fullmatch(name) is None:
            raise ValueError(f"{path}:{line_number} has an invalid variable name: {name}")
        if name in values:
            raise ValueError(f"{path}:{line_number} duplicates variable: {name}")
        reject_control_characters(value, context=f"{path}:{line_number} value")
        values[name] = value
    return values


def require_private_runtime_env(path: Path) -> None:
    file_stat = path.stat()
    mode = stat.S_IMODE(file_stat.st_mode)
    if mode != 0o600:
        raise ValueError(f"{path} must have mode 0600; found {mode:04o}.")
    if file_stat.st_uid != os.geteuid():
        raise ValueError(f"{path} must be owned by the current runtime user.")


def exec_with_runtime_env(path: Path, command: list[str]) -> None:
    require_private_runtime_env(path)
    values = parse_runtime_env(path)
    environment = os.environ.copy()
    environment.update(values)
    environment[RUNTIME_ENV_LOADED] = "1"
    environment["COMPOSE_DISABLE_ENV_FILE"] = "true"
    os.execvpe(command[0], command, environment)


def run_self_test() -> None:
    cases = {
        "PLAIN": "value",
        "EMPTY": "",
        "SPACES": "two words",
        "SINGLE_QUOTE": "owner's value",
        "DOUBLE_QUOTE": 'a "quoted" value',
        "SUBSTITUTION": "$(touch must-not-run)",
        "BACKTICK": "`touch must-not-run`",
        "TRAILING_BACKSLASH": "ends-with-backslash\\",
        "HASH": "value#literal",
        "UNICODE": "Привет",
    }
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / ".env"
        path.write_text(
            "\n".join(f"{name}={shlex.quote(value)}" for name, value in cases.items()) + "\n",
            encoding="utf-8",
        )
        path.chmod(0o600)
        require_private_runtime_env(path)
        if parse_runtime_env(path) != cases:
            raise AssertionError("Runtime environment literal round-trip failed.")
        path.write_bytes(b"BAD=value\r\n")
        path.chmod(0o600)
        try:
            parse_runtime_env(path)
        except ValueError:
            pass
        else:
            raise AssertionError("CRLF runtime environment was not rejected.")
        path.write_text("BAD='value\u0085'\n", encoding="utf-8")
        path.chmod(0o600)
        try:
            parse_runtime_env(path)
        except ValueError:
            pass
        else:
            raise AssertionError("Unicode control characters were not rejected.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate and load a private runtime environment.")
    subparsers = parser.add_subparsers(dest="action", required=True)
    exec_parser = subparsers.add_parser("exec")
    exec_parser.add_argument("--path", required=True, type=Path)
    exec_parser.add_argument("command", nargs=argparse.REMAINDER)
    subparsers.add_parser("self-test")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.action == "self-test":
            run_self_test()
            return 0
        if not args.command:
            raise ValueError("A command is required after --path.")
        exec_with_runtime_env(args.path, args.command)
    except (OSError, ValueError) as exc:
        print(f"runtime_env.py: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
