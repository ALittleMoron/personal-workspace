#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import stat
import sys
import tempfile
from pathlib import Path


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
            raise ValueError(f"Active-slot parent is not a directory: {directory}")
        return
    directory.mkdir(mode=0o700)
    fsync_directory(directory.parent)


def write_active_slot(path: Path, slot: str) -> None:
    if slot not in VALID_SLOTS:
        raise ValueError(f"Invalid active slot: {slot}")
    ensure_state_directory(path)

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
            stream.write(f"{slot}\n")
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


def clear_active_slot(path: Path) -> None:
    try:
        path.unlink()
    except FileNotFoundError:
        return
    fsync_directory(path.parent)


def run_self_test() -> None:
    with tempfile.TemporaryDirectory() as raw_directory:
        state_path = Path(raw_directory) / ".deploy-state" / "active-slot"

        write_active_slot(state_path, "blue")
        if state_path.read_text(encoding="utf-8") != "blue\n":
            raise AssertionError("Target active-slot write failed.")
        if stat.S_IMODE(state_path.stat().st_mode) != 0o600:
            raise AssertionError("Active-slot state must have mode 0600.")

        write_active_slot(state_path, "green")
        if state_path.read_text(encoding="utf-8") != "green\n":
            raise AssertionError("Rollback active-slot restore failed.")

        clear_active_slot(state_path)
        if state_path.exists():
            raise AssertionError("Fail-closed active-slot removal failed.")

        clear_active_slot(state_path)
        if state_path.exists():
            raise AssertionError("First-deploy active-slot removal failed.")

        try:
            write_active_slot(state_path, "unknown")
        except ValueError:
            pass
        else:
            raise AssertionError("Invalid active slot was not rejected.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Persist truthful blue/green active-slot state.")
    subparsers = parser.add_subparsers(dest="action", required=True)

    write_parser = subparsers.add_parser("write")
    write_parser.add_argument("--path", required=True, type=Path)
    write_parser.add_argument("--slot", required=True)

    clear_parser = subparsers.add_parser("clear")
    clear_parser.add_argument("--path", required=True, type=Path)

    subparsers.add_parser("self-test")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.action == "write":
            write_active_slot(args.path, args.slot)
        elif args.action == "clear":
            clear_active_slot(args.path)
        else:
            run_self_test()
    except (OSError, ValueError) as exc:
        print(f"active_slot_state.py: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
