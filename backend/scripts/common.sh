#!/usr/bin/env bash

backend_script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
backend_dir="$(cd -- "${backend_script_dir}/.." && pwd)"
repo_dir="$(cd -- "${backend_dir}/.." && pwd)"

require_uv() {
    if ! command -v uv >/dev/null 2>&1; then
        echo "UV could not be found." >&2
        exit 2
    fi
}

ensure_backend_deps() {
    local marker=".venv/.self-contained-all-groups"

    require_uv

    if [ -x .venv/bin/python ] \
        && [ -f "$marker" ] \
        && [ ! pyproject.toml -nt "$marker" ] \
        && [ ! uv.lock -nt "$marker" ]; then
        return
    fi

    uv sync --locked --all-groups
    mkdir -p .venv
    touch "$marker"
}

invalidate_backend_deps_marker() {
    rm -f .venv/.self-contained-all-groups
}

run_with_test_env() {
    # Intentional word splitting preserves the previous Makefile's KEY=value override form.
    env ${TEST_ENV_OVERRIDES:-} PYTHONPATH=src "$@"
}

load_backend_env_file() {
    local env_file="$1"
    local line
    local variable_name
    local value

    if [ ! -r "$env_file" ]; then
        echo "Test environment file is not readable: ${env_file}" >&2
        return 2
    fi

    while IFS= read -r line || [ -n "$line" ]; do
        line="${line%$'\r'}"
        if [ -z "$line" ] || [[ "$line" == \#* ]]; then
            continue
        fi
        if [[ "$line" != *=* ]]; then
            echo "Invalid test environment entry in ${env_file}: ${line}" >&2
            return 2
        fi
        variable_name="${line%%=*}"
        value="${line#*=}"
        if [[ ! "$variable_name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
            echo "Invalid variable name in ${env_file}: ${variable_name}" >&2
            return 2
        fi
        export "$variable_name=$value"
    done < "$env_file"

    export PERSONAL_WORKSPACE_TEST_ENV_PRELOADED=1
}

load_test_service_helpers() {
    local helper_path="${repo_dir}/infra/scripts/test_services.sh"

    if [ ! -r "$helper_path" ]; then
        echo "Database test helpers are unavailable: ${helper_path}" >&2
        echo "Non-database backend commands remain available; add the infrastructure foundation before database-backed tests." >&2
        return 2
    fi

    # shellcheck source=../../infra/scripts/test_services.sh
    . "$helper_path"
    if ! declare -F ensure_test_db >/dev/null || ! declare -F cleanup_owned_test_db >/dev/null; then
        echo "Database test helper contract is incomplete: ${helper_path}" >&2
        return 2
    fi
}

ensure_backend_test_db() {
    local compose_file="${1:-docker-compose.test.yml}"
    local forced_port="${2:-}"

    load_test_service_helpers
    ensure_test_db "$TEST_ENV_FILE" "$compose_file" "$forced_port"
}
