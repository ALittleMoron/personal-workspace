#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
. "$script_dir/common.sh"
cd "$backend_dir"

run_types() {
    PYTHONPATH=src uv run mypy --explicit-package-bases --namespace-packages \
        --config-file pyproject.toml src tests
}

run_bandit() {
    uv run bandit --configfile ./pyproject.toml -r ./src
}

run_vulture() {
    PYTHONPATH=src uv run vulture src --min-confidence 100
}

run_format() {
    uv run ruff format src tests --config ./pyproject.toml
}

run_format_check() {
    uv run ruff format src tests --check --config ./pyproject.toml
}

run_lint_file() {
    local file_path="${1:-}"
    if [ -z "$file_path" ]; then
        echo "file is required. Use: make -C backend lint-file file=path/to/file.py" >&2
        exit 2
    fi
    uv run ruff check --fix "$file_path" --config ./pyproject.toml
    uv run ruff format "$file_path" --config ./pyproject.toml
}

run_ruff_check() {
    uv run ruff check src tests --fix --config ./pyproject.toml
}

run_ruff_lint_check() {
    uv run ruff check src tests --config ./pyproject.toml
}

action="${1:?action is required}"
shift
test_env_file="${1:-${TEST_ENV_FILE:-../.env.test}}"
test_env_overrides="${2:-${TEST_ENV_OVERRIDES:-}}"

if [ "$action" != "clean" ]; then
    ensure_backend_deps
fi

case "$action" in
    clean)
        find . -type d -name "__pycache__" -prune -exec rm -rf {} +
        ;;
    types) run_types ;;
    bandit) run_bandit ;;
    vulture) run_vulture ;;
    format | fix) run_format ;;
    format-check) run_format_check ;;
    lint-file) run_lint_file "$@" ;;
    ruff-check) run_ruff_check ;;
    ruff-lint-check) run_ruff_lint_check ;;
    lint-check)
        run_format_check
        run_ruff_lint_check
        ;;
    quality)
        run_bandit
        run_vulture
        run_format_check
        run_types
        run_ruff_lint_check
        bash "$script_dir/test.sh" test "$test_env_file" "$test_env_overrides"
        ;;
    *)
        echo "Unknown quality action: $action" >&2
        exit 2
        ;;
esac
