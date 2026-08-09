#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd -- "${script_dir}/../.." && pwd)"
cd "$repo_dir"

if [ "${PERSONAL_WORKSPACE_RUNTIME_ENV_LOADED:-}" != "1" ]; then
    exec python3 "$script_dir/runtime_env.py" exec --path "$repo_dir/.env" \
        bash "$script_dir/stop.sh" "$@"
fi

# shellcheck source=compose_secrets.sh
. "$script_dir/compose_secrets.sh"

prepare_compose_secret_files

docker compose --profile '*' down --remove-orphans
python3 "$script_dir/active_slot_state.py" clear \
    --path "$repo_dir/.deploy-state/active-slot"
python3 "$script_dir/deployment_transition_state.py" clear \
    --path "$repo_dir/.deploy-state/deployment-transition.json"
