#!/usr/bin/env bash
# Run the repository's focused lint target after a Python-file edit when available.
set -euo pipefail

input=$(cat)
file=$(printf '%s' "$input" | python3 -c '
import json
import sys

payload = json.load(sys.stdin)
print(payload.get("tool_input", {}).get("file_path", ""))
' 2>/dev/null || true)

[[ -n "$file" && "$file" == *.py && -f "$file" ]] || exit 0

repo=$(git -C "$(dirname "$file")" rev-parse --show-toplevel 2>/dev/null) || exit 0
make -C "$repo/backend" lint-file file="$file"
