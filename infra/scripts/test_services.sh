#!/usr/bin/env bash

test_services_script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
test_services_repo_dir="$(cd -- "${test_services_script_dir}/../.." && pwd)"

TEST_DB_OWNED="${TEST_DB_OWNED:-0}"
TEST_DB_ENV_FILE=""
TEST_DB_COMPOSE_FILE=""
TEST_DB_COMPOSE_PROJECT_NAME="${TEST_DB_COMPOSE_PROJECT_NAME:-personal-workspace-test}"

resolve_path_from() {
    local base_dir="$1"
    local path="$2"
    local path_dir
    local path_base

    if [[ "$path" = /* ]]; then
        printf '%s\n' "$path"
        return
    fi
    path_dir="$(dirname -- "$path")"
    path_base="$(basename -- "$path")"
    printf '%s/%s\n' "$(cd -- "${base_dir}/${path_dir}" && pwd -P)" "$path_base"
}

load_env_file() {
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
}

tcp_port_open() {
    (echo >"/dev/tcp/$1/$2") >/dev/null 2>&1
}

test_db_is_available() {
    tcp_port_open "${DB_HOST:-localhost}" "${DB_PORT:-55432}"
}

ensure_test_db() {
    local env_file="$1"
    local compose_file="${2:-docker-compose.test.yml}"
    local forced_port="${3:-}"

    TEST_DB_ENV_FILE="$(resolve_path_from "$PWD" "$env_file")"
    TEST_DB_COMPOSE_FILE="$(resolve_path_from "$test_services_repo_dir" "$compose_file")"
    load_env_file "$TEST_DB_ENV_FILE"
    if [ -n "$forced_port" ]; then
        DB_PORT="$forced_port"
        export DB_PORT
    fi
    if test_db_is_available; then
        TEST_DB_OWNED=0
        return
    fi

    TEST_DB_OWNED=1
    if ! (
        cd "$test_services_repo_dir"
        docker compose --project-name "$TEST_DB_COMPOSE_PROJECT_NAME" \
            --env-file "$TEST_DB_ENV_FILE" -f "$TEST_DB_COMPOSE_FILE" \
            up -d --wait postgres-test
    ); then
        cleanup_owned_test_db
        return 1
    fi
}

cleanup_owned_test_db() {
    if [ "${TEST_DB_OWNED:-0}" != "1" ]; then
        return
    fi
    if ! (
        cd "$test_services_repo_dir"
        docker compose --project-name "$TEST_DB_COMPOSE_PROJECT_NAME" \
            --env-file "$TEST_DB_ENV_FILE" -f "$TEST_DB_COMPOSE_FILE" \
            down -v --remove-orphans
    ); then
        echo "Owned test database cleanup failed for project ${TEST_DB_COMPOSE_PROJECT_NAME}." >&2
        return 1
    fi
    TEST_DB_OWNED=0
}

exit_with_cleanup() {
    local original_status="$1"
    local cleanup_function="$2"
    local cleanup_status

    trap - EXIT
    set +e
    "$cleanup_function"
    cleanup_status=$?
    set -e
    if [ "$original_status" -eq 0 ] && [ "$cleanup_status" -ne 0 ]; then
        original_status="$cleanup_status"
    fi
    exit "$original_status"
}
