#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
. "$script_dir/common.sh"
cd "$backend_dir"

action="${1:?action is required}"
require_uv

case "$action" in
    run)
        PYTHONPATH=src uv run granian --interface asgi --factory \
            --host 0.0.0.0 --port 8080 main:create_app
        ;;
    run-local)
        PYTHONPATH=src APP_DEBUG=true APP_DOMAIN=localhost APP_URL_SCHEMA=http \
            DB_HOST=localhost MINIO_HOST=localhost VALKEY_HOST=localhost \
            uv run granian --interface asgi --factory \
            --host localhost --port 8000 --reload main:create_app
        ;;
    taskiq-worker)
        PYTHONPATH=src uv run taskiq worker entrypoints.taskiq.worker:broker
        ;;
    taskiq-scheduler)
        PYTHONPATH=src uv run taskiq scheduler entrypoints.taskiq.worker:scheduler
        ;;
    shell)
        PYTHONPATH=src uv run ipython --no-confirm-exit --no-banner --quick \
            --InteractiveShellApp.extensions="autoreload" \
            --InteractiveShellApp.exec_lines="%autoreload 2"
        ;;
    *)
        echo "Unknown app action: $action" >&2
        exit 2
        ;;
esac
