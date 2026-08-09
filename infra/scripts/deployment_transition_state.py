#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import stat
import sys
import tempfile
from pathlib import Path
from typing import Any


VALID_SLOTS = {"blue", "green"}


def fsync_directory(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def ensure_state_directory(path: Path) -> None:
    directory = path.parent
    if directory.exists():
        if not directory.is_dir():
            raise ValueError(f"Transition parent is not a directory: {directory}")
        return
    directory.mkdir(mode=0o700)
    fsync_directory(directory.parent)


def validate_transition(document: Any) -> tuple[str | None, str]:
    if not isinstance(document, dict) or set(document) != {
        "previous_slot",
        "target_slot",
        "version",
    }:
        raise ValueError("Deployment transition has an invalid shape")
    if document["version"] != 1:
        raise ValueError("Deployment transition has an unsupported version")
    previous_slot = document["previous_slot"]
    target_slot = document["target_slot"]
    if previous_slot is not None and previous_slot not in VALID_SLOTS:
        raise ValueError("Deployment transition has an invalid previous slot")
    if target_slot not in VALID_SLOTS or target_slot == previous_slot:
        raise ValueError("Deployment transition has an invalid target slot")
    return previous_slot, target_slot


def write_transition(path: Path, previous_slot: str | None, target_slot: str) -> None:
    validate_transition(
        {"previous_slot": previous_slot, "target_slot": target_slot, "version": 1}
    )
    ensure_state_directory(path)
    payload = json.dumps(
        {"previous_slot": previous_slot, "target_slot": target_slot, "version": 1},
        separators=(",", ":"),
        sort_keys=True,
    )
    descriptor, raw_temporary_path = tempfile.mkstemp(
        prefix=f".{path.name}.", dir=path.parent
    )
    temporary_path: Path | None = Path(raw_temporary_path)
    descriptor_open = True
    try:
        os.fchmod(descriptor, 0o600)
        stream = os.fdopen(descriptor, "w", encoding="utf-8", newline="\n")
        descriptor_open = False
        with stream:
            stream.write(f"{payload}\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary_path, path)
        temporary_path = None
        fsync_directory(path.parent)
    finally:
        if descriptor_open:
            os.close(descriptor)
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def read_transition(path: Path) -> tuple[str | None, str]:
    document = json.loads(path.read_text(encoding="utf-8"))
    return validate_transition(document)


def clear_transition(path: Path) -> None:
    try:
        path.unlink()
    except FileNotFoundError:
        return
    fsync_directory(path.parent)


def run_self_test() -> None:
    with tempfile.TemporaryDirectory() as raw_directory:
        path = Path(raw_directory) / ".deploy-state" / "deployment-transition.json"
        write_transition(path, "blue", "green")
        if read_transition(path) != ("blue", "green"):
            raise AssertionError("Deployment transition round-trip failed.")
        if stat.S_IMODE(path.stat().st_mode) != 0o600:
            raise AssertionError("Deployment transition must have mode 0600.")
        clear_transition(path)
        if path.exists():
            raise AssertionError("Deployment transition removal failed.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Persist a blue/green deployment transition.")
    subparsers = parser.add_subparsers(dest="action", required=True)

    write_parser = subparsers.add_parser("write")
    write_parser.add_argument("--path", required=True, type=Path)
    write_parser.add_argument("--previous-slot", choices=("blue", "green"))
    write_parser.add_argument("--target-slot", required=True, choices=("blue", "green"))

    read_parser = subparsers.add_parser("read")
    read_parser.add_argument("--path", required=True, type=Path)

    clear_parser = subparsers.add_parser("clear")
    clear_parser.add_argument("--path", required=True, type=Path)

    subparsers.add_parser("self-test")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.action == "write":
            write_transition(args.path, args.previous_slot, args.target_slot)
        elif args.action == "read":
            previous_slot, target_slot = read_transition(args.path)
            print(f"{previous_slot or '-'} {target_slot}")
        elif args.action == "clear":
            clear_transition(args.path)
        else:
            run_self_test()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"deployment_transition_state.py: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
