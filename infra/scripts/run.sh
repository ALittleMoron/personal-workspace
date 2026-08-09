#!/usr/bin/env bash
set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd -- "${script_dir}/../.." && pwd)"
cd "$repo_dir"

if [ "${PERSONAL_WORKSPACE_RUNTIME_ENV_LOADED:-}" != "1" ]; then
    exec python3 "$script_dir/runtime_env.py" exec --path "$repo_dir/.env" \
        bash "$script_dir/run.sh" "$@"
fi

# shellcheck source=compose_secrets.sh
. "$script_dir/compose_secrets.sh"
# shellcheck source=docker_context.sh
. "$script_dir/docker_context.sh"

readonly COMPOSE_WAIT_TIMEOUT_SECONDS=180
readonly DEPLOY_DRAIN_SECONDS=10
readonly DEPLOY_STATE_DIR="${repo_dir}/.deploy-state"
readonly ACTIVE_SLOT_FILE="${DEPLOY_STATE_DIR}/active-slot"
readonly DEPLOYMENT_TRANSITION_FILE="${DEPLOY_STATE_DIR}/deployment-transition.json"

cutover_attempted=0
cutover_committed=0
previous_slot=""
target_slot=""
target_started=0
scheduler_switched=0
recovery_in_progress=0

require_command() {
    local command_name="$1"
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "${command_name} could not be found. Install it." >&2
        exit 1
    fi
}

require_env() {
    local variable_name="$1"
    if [ -z "${!variable_name:-}" ]; then
        echo "${variable_name} must be set in .env." >&2
        exit 1
    fi
}

require_env_set() {
    local variable_name="$1"
    if [ "${!variable_name+x}" != "x" ]; then
        echo "${variable_name} must be set in .env." >&2
        exit 1
    fi
}

require_environment() {
    local variable_name
    local required_variables=(
        VPN_BIND_ADDRESS VPN_INTERFACE APP_URL_SCHEMA APP_DEBUG APP_DOMAIN
        DB_USER DB_PASSWORD DB_DRIVER DB_HOST DB_PORT DB_NAME DB_POOL_PRE_PING DB_POOL_SIZE
        DB_MAX_OVERFLOW DB_EXPIRE_ON_COMMIT DB_LOG_QUERY_METRICS
        DB_SLOW_QUERY_LOG_THRESHOLD_MS DB_SLOW_QUERY_LOG_STATEMENT_MAX_LENGTH
        MINIO_HOST MINIO_PORT MINIO_REGION MINIO_SECRET_KEY MINIO_ACCESS_KEY MINIO_SECURE
        SENTRY_USE VALKEY_HOST VALKEY_PORT I18N_DEFAULT_LANGUAGE TASKIQ_RESULT_EXPIRE_SECONDS
        LE_EMAIL SSL_CERT SSL_KEY IMAGE_TAG
    )

    for variable_name in "${required_variables[@]}"; do
        require_env "$variable_name"
    done
    require_env_set SENTRY_DSN
    if [ "$IMAGE_TAG" = "latest" ]; then
        echo "IMAGE_TAG must not use the mutable latest tag." >&2
        exit 1
    fi
}

verify_vpn_binding() {
    local link_json

    if [[ ! "$VPN_INTERFACE" =~ ^[A-Za-z0-9_.:-]+$ ]]; then
        echo "VPN_INTERFACE contains unsupported characters." >&2
        exit 1
    fi
    if ! python3 - "$VPN_BIND_ADDRESS" <<'PY'
import ipaddress
import sys

try:
    address = ipaddress.IPv4Address(sys.argv[1])
except ipaddress.AddressValueError:
    raise SystemExit(1)
if not address.is_private or address.is_loopback or address.is_link_local \
        or address.is_multicast or address.is_unspecified:
    raise SystemExit(1)
PY
    then
        echo "VPN_BIND_ADDRESS must be a private, non-loopback IPv4 address." >&2
        exit 1
    fi
    if ! link_json="$(ip -json -details link show dev "$VPN_INTERFACE" 2>/dev/null)"; then
        echo "VPN_INTERFACE does not name a local network interface: ${VPN_INTERFACE}" >&2
        exit 1
    fi
    if ! python3 - "$VPN_INTERFACE" "$link_json" <<'PY'
import json
import sys

expected_name = sys.argv[1]
try:
    links = json.loads(sys.argv[2])
except json.JSONDecodeError:
    raise SystemExit(1)
if not isinstance(links, list) or len(links) != 1:
    raise SystemExit(1)
link = links[0]
if not isinstance(link, dict) or link.get("ifname") != expected_name:
    raise SystemExit(1)
flags = link.get("flags")
if not isinstance(flags, list) or "UP" not in flags:
    raise SystemExit(1)
link_info = link.get("linkinfo", {})
if not isinstance(link_info, dict) or link_info.get("info_kind") != "wireguard":
    raise SystemExit(1)
PY
    then
        echo "VPN_INTERFACE must be an administratively active WireGuard link." >&2
        exit 1
    fi
    if ! ip -o -4 address show dev "$VPN_INTERFACE" | awk -v expected="$VPN_BIND_ADDRESS" '
        {
            split($4, address, "/")
            if (address[1] == expected) {
                found = 1
            }
        }
        END { exit found ? 0 : 1 }
    '; then
        echo "VPN_BIND_ADDRESS is not assigned to VPN_INTERFACE." >&2
        exit 1
    fi
}

other_slot() {
    case "$1" in
        blue) printf '%s\n' green ;;
        green) printf '%s\n' blue ;;
        *)
            echo "Unknown deploy slot: $1" >&2
            exit 1
            ;;
    esac
}

read_active_slot() {
    if [ -f "$ACTIVE_SLOT_FILE" ]; then
        cat "$ACTIVE_SLOT_FILE"
        return
    fi
    printf '%s\n' "${ACTIVE_DEPLOY_SLOT:-}"
}

compose_up_wait() {
    docker compose up --wait --build --detach --remove-orphans \
        --wait-timeout "$COMPOSE_WAIT_TIMEOUT_SECONDS" "$@"
}

run_backend_init() {
    docker compose build backend-init
    docker compose run --rm backend-init
}

sync_certificates() {
    docker compose run --rm cert-sync
}

preflight_nginx() {
    docker compose build nginx
    docker compose run --rm --no-deps \
        -e NGINX_VALIDATE_ONLY=1 \
        -e ACTIVE_BACKEND_SLOT="$ACTIVE_BACKEND_SLOT" \
        -e ACTIVE_FRONTEND_SLOT="$ACTIVE_FRONTEND_SLOT" \
        nginx
}

verify_restart_policy() {
    local service_name="$1"
    local expected_policy="$2"
    local container_ids
    local container_id
    local actual_policy

    if ! container_ids="$(docker compose ps -q "$service_name")"; then
        echo "Running containers for ${service_name} could not be listed." >&2
        return 1
    fi
    if [ -z "$container_ids" ]; then
        echo "Running container for ${service_name} could not be found." >&2
        return 1
    fi
    while IFS= read -r container_id; do
        if ! actual_policy="$(docker inspect \
            --format '{{.HostConfig.RestartPolicy.Name}}' "$container_id")"; then
            echo "Restart policy for ${service_name} could not be inspected." >&2
            return 1
        fi
        if [ "$actual_policy" != "$expected_policy" ]; then
            echo "Unexpected restart policy for ${service_name}: ${actual_policy}." >&2
            return 1
        fi
    done <<<"$container_ids"
}

verify_runtime_restart_policies() {
    local service_name
    for service_name in \
        "$ACTIVE_BACKEND_SLOT" "$ACTIVE_FRONTEND_SLOT" "$ACTIVE_WORKER_SLOT" \
        "$ACTIVE_SCHEDULER_SLOT" \
        postgres valkey minio databasus; do
        verify_restart_policy "$service_name" unless-stopped || return 1
    done
    verify_restart_policy nginx always || return 1
}

smoke_edge() {
    local edge_health_url
    local attempt
    for edge_health_url in \
        "https://${APP_DOMAIN}/api/healthcheck" \
        "https://${APP_DOMAIN}/healthz"; do
        for attempt in {1..30}; do
            if curl -fsS -o /dev/null --max-time 5 "$edge_health_url"; then
                break
            fi
            if [ "$attempt" -eq 30 ]; then
                echo "Edge healthcheck failed: ${edge_health_url}" >&2
                return 1
            fi
            sleep 1
        done
    done
}

persist_active_slot() {
    python3 "$script_dir/active_slot_state.py" write --path "$ACTIVE_SLOT_FILE" --slot "$1"
}

clear_active_slot_state() {
    python3 "$script_dir/active_slot_state.py" clear --path "$ACTIVE_SLOT_FILE"
}

write_deployment_transition() {
    local -a arguments=(
        write
        --path "$DEPLOYMENT_TRANSITION_FILE"
        --target-slot "$target_slot"
    )
    if [ -n "$previous_slot" ]; then
        arguments+=(--previous-slot "$previous_slot")
    fi
    python3 "$script_dir/deployment_transition_state.py" "${arguments[@]}"
}

clear_deployment_transition() {
    python3 "$script_dir/deployment_transition_state.py" clear \
        --path "$DEPLOYMENT_TRANSITION_FILE"
}

set_active_slot_environment() {
    local slot="$1"

    export ACTIVE_DEPLOY_SLOT="$slot"
    export ACTIVE_BACKEND_SLOT="backend-${slot}"
    export ACTIVE_FRONTEND_SLOT="frontend-${slot}"
    export ACTIVE_WORKER_SLOT="taskiq-worker-${slot}"
    export ACTIVE_SCHEDULER_SLOT="taskiq-scheduler-${slot}"
}

stop_previous_slot() {
    local previous_slot="$1"
    if [ -z "$previous_slot" ]; then
        return
    fi
    sleep "$DEPLOY_DRAIN_SECONDS"
    stop_slot_strict "$previous_slot"
}

stop_target_slot() {
    if [ "$target_started" -ne 1 ] || [ -z "$target_slot" ]; then
        return
    fi
    if ! stop_slot_strict "$target_slot"; then
        return 1
    fi
    target_started=0
}

stop_service_strict() {
    local service_name="$1"
    local container_ids
    local container_id
    local running

    if ! container_ids="$(docker compose ps -a -q "$service_name")"; then
        echo "Containers for service ${service_name} could not be listed." >&2
        return 1
    fi
    if ! docker compose stop "$service_name"; then
        echo "Graceful stop failed for ${service_name}; forcing it to stop." >&2
        if ! docker compose kill "$service_name"; then
            echo "Service ${service_name} could not be stopped." >&2
            return 1
        fi
    fi
    while IFS= read -r container_id; do
        [ -z "$container_id" ] && continue
        if ! running="$(docker inspect --format '{{.State.Running}}' "$container_id")"; then
            echo "Container state for ${service_name} could not be inspected." >&2
            return 1
        fi
        if [ "$running" != "false" ]; then
            echo "Service ${service_name} is still running after stop." >&2
            return 1
        fi
    done <<<"$container_ids"
}

remove_service_strict() {
    local service_name="$1"
    local container_ids
    local container_id
    local remaining_ids

    if ! container_ids="$(docker compose ps -a -q "$service_name")"; then
        echo "Containers for service ${service_name} could not be listed for removal." >&2
        return 1
    fi
    if [ -z "$container_ids" ]; then
        return
    fi
    if ! docker compose rm --stop --force "$service_name"; then
        echo "Compose removal failed for ${service_name}; forcing container removal." >&2
        while IFS= read -r container_id; do
            [ -z "$container_id" ] && continue
            if ! docker rm --force "$container_id"; then
                echo "Container for service ${service_name} could not be removed." >&2
                return 1
            fi
        done <<<"$container_ids"
    fi
    if ! remaining_ids="$(docker compose ps -a -q "$service_name")"; then
        echo "Removal of service ${service_name} could not be verified." >&2
        return 1
    fi
    if [ -n "$remaining_ids" ]; then
        echo "Service ${service_name} still has containers after removal." >&2
        return 1
    fi
}

stop_slot_strict() {
    local slot="$1"
    local service_name
    local status=0

    for service_name in \
        "backend-${slot}" \
        "frontend-${slot}" \
        "taskiq-worker-${slot}" \
        "taskiq-scheduler-${slot}"; do
        if ! stop_service_strict "$service_name"; then
            status=1
        fi
    done
    return "$status"
}

stop_all_schedulers_strict() {
    local status=0

    stop_service_strict taskiq-scheduler-blue || status=1
    stop_service_strict taskiq-scheduler-green || status=1
    return "$status"
}

stop_all_slots_strict() {
    local status=0

    stop_slot_strict blue || status=1
    stop_slot_strict green || status=1
    return "$status"
}

wait_for_service_health() {
    local service_name="$1"
    local container_id
    local health_status
    local attempt

    if ! container_id="$(docker compose ps -q "$service_name")" \
        || [ -z "$container_id" ]; then
        echo "Running container for ${service_name} could not be found." >&2
        return 1
    fi
    for attempt in {1..36}; do
        if ! health_status="$(docker inspect \
            --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
            "$container_id")"; then
            echo "Container health for ${service_name} could not be inspected." >&2
            return 1
        fi
        if [ "$health_status" = "healthy" ] || [ "$health_status" = "running" ]; then
            return
        fi
        if [ "$health_status" = "unhealthy" ] || [ "$health_status" = "exited" ] \
            || [ "$health_status" = "dead" ]; then
            echo "Service ${service_name} could not be restored: ${health_status}." >&2
            return 1
        fi
        sleep 5
    done
    echo "Service ${service_name} did not become healthy." >&2
    return 1
}

start_existing_slot() {
    local slot="$1"
    local service_name
    local -a services=(
        "backend-${slot}"
        "frontend-${slot}"
        "taskiq-worker-${slot}"
        "taskiq-scheduler-${slot}"
    )

    if ! docker compose start "${services[@]}"; then
        echo "Existing deployment slot ${slot} could not be started." >&2
        return 1
    fi
    for service_name in "${services[@]}"; do
        wait_for_service_health "$service_name" || return 1
    done
}

restore_previous_scheduler() {
    if [ "$scheduler_switched" -ne 1 ]; then
        return
    fi
    if ! stop_service_strict "$ACTIVE_SCHEDULER_SLOT"; then
        return 1
    fi
    if [ -n "$previous_slot" ]; then
        if ! docker compose start "taskiq-scheduler-${previous_slot}"; then
            echo "Previous TaskIQ scheduler container could not be started." >&2
            return 1
        fi
        wait_for_service_health "taskiq-scheduler-${previous_slot}" || return 1
    fi
    scheduler_switched=0
}

switch_scheduler() {
    scheduler_switched=1
    if [ -n "$previous_slot" ]; then
        if ! stop_service_strict "taskiq-scheduler-${previous_slot}"; then
            return 1
        fi
    fi
    compose_up_wait "$ACTIVE_SCHEDULER_SLOT"
}

finalize_interrupted_target() {
    set_active_slot_environment "$target_slot"
    target_started=1
    compose_up_wait \
        "$ACTIVE_BACKEND_SLOT" "$ACTIVE_FRONTEND_SLOT" "$ACTIVE_WORKER_SLOT" || return 1
    stop_all_schedulers_strict || return 1
    compose_up_wait "$ACTIVE_SCHEDULER_SLOT" || return 1
    sync_certificates || return 1
    preflight_nginx || return 1
    compose_up_wait --force-recreate nginx || return 1
    verify_runtime_restart_policies || return 1
    smoke_edge || return 1
    persist_active_slot "$target_slot" || return 1
    stop_previous_slot "$previous_slot" || return 1
    clear_deployment_transition || return 1
}

rollback_interrupted_target() {
    target_started=1
    stop_target_slot || return 1
    stop_all_schedulers_strict || return 1

    if [ -z "$previous_slot" ]; then
        remove_service_strict nginx || return 1
        clear_active_slot_state || return 1
        clear_deployment_transition || return 1
        return
    fi

    start_existing_slot "$previous_slot" || return 1
    set_active_slot_environment "$previous_slot"
    sync_certificates || return 1
    preflight_nginx || return 1
    compose_up_wait --force-recreate nginx || return 1
    verify_runtime_restart_policies || return 1
    smoke_edge || return 1
    persist_active_slot "$previous_slot" || return 1
    clear_deployment_transition || return 1
}

recover_incomplete_deployment() {
    local active_slot
    local raw_previous_slot
    local transition

    if [ ! -f "$DEPLOYMENT_TRANSITION_FILE" ]; then
        return
    fi
    if ! transition="$(python3 "$script_dir/deployment_transition_state.py" read \
        --path "$DEPLOYMENT_TRANSITION_FILE")"; then
        return 1
    fi
    read -r raw_previous_slot target_slot <<<"$transition"
    if [ "$raw_previous_slot" = "-" ]; then
        previous_slot=""
    else
        previous_slot="$raw_previous_slot"
    fi
    active_slot="$(read_active_slot)"
    if [ -n "$active_slot" ] \
        && [ "$active_slot" != "$previous_slot" ] \
        && [ "$active_slot" != "$target_slot" ]; then
        echo "Active slot does not match the durable deployment transition." >&2
        return 1
    fi

    echo "Recovering interrupted deployment ${previous_slot:--}->${target_slot}." >&2
    if [ "$active_slot" = "$target_slot" ]; then
        finalize_interrupted_target || return 1
    else
        rollback_interrupted_target || return 1
    fi

    target_started=0
    scheduler_switched=0
    previous_slot=""
    target_slot=""
}

handle_deploy_exit() {
    local original_status="$1"
    local cleanup_status

    trap - EXIT
    if [ "$recovery_in_progress" -eq 1 ]; then
        set +e
        echo "Interrupted deployment recovery failed; stopping both slots and nginx fail-closed." >&2
        cleanup_status=0
        remove_service_strict nginx || cleanup_status=1
        stop_all_slots_strict || cleanup_status=1
        if [ "$cleanup_status" -eq 0 ]; then
            if ! clear_active_slot_state; then
                cleanup_status=1
            elif ! clear_deployment_transition; then
                cleanup_status=1
            fi
        else
            echo "Deployment state is retained because recovery shutdown was incomplete." >&2
        fi
        exit 1
    fi
    if [ "$cutover_committed" -eq 1 ]; then
        exit "$original_status"
    fi

    if [ "$cutover_attempted" -ne 1 ]; then
        cleanup_status=0
        stop_target_slot || cleanup_status=1
        restore_previous_scheduler || cleanup_status=1
        if [ "$cleanup_status" -eq 0 ]; then
            clear_deployment_transition || cleanup_status=1
        fi
        if [ "$original_status" -eq 0 ] && [ "$cleanup_status" -ne 0 ]; then
            original_status="$cleanup_status"
        fi
        exit "$original_status"
    fi

    set +e
    echo "Deployment failed after the nginx cutover attempt; starting rollback." >&2
    if [ -n "$previous_slot" ]; then
        set_active_slot_environment "$previous_slot"
        if restore_previous_scheduler \
            && compose_up_wait --force-recreate nginx \
            && verify_runtime_restart_policies \
            && smoke_edge; then
            if persist_active_slot "$previous_slot" && stop_target_slot; then
                if clear_deployment_transition; then
                    echo "Rollback restored, smoke-checked, and recorded deployment slot ${previous_slot}." >&2
                    exit "$original_status"
                fi
                echo "Rollback is healthy, but its durable transition marker remains." >&2
                exit 1
            fi
            echo "Rollback traffic recovered, but state recording or target cleanup failed." >&2
        else
            echo "Rollback could not restore a healthy previous slot." >&2
        fi
    else
        echo "No previous deployment slot exists." >&2
    fi

    echo "Stopping both slots and nginx fail-closed before removing deployment state." >&2
    cleanup_status=0
    if ! remove_service_strict nginx; then
        echo "Fail-closed nginx removal also failed; manual operator intervention is required." >&2
        cleanup_status=1
    fi
    stop_all_slots_strict || cleanup_status=1
    if [ "$cleanup_status" -eq 0 ]; then
        if ! clear_active_slot_state; then
            echo "Active-slot state removal failed; treat any remaining state as invalid." >&2
            cleanup_status=1
        elif ! clear_deployment_transition; then
            echo "Deployment transition removal failed; recovery remains required." >&2
            cleanup_status=1
        fi
    else
        echo "Deployment state is retained because runtime shutdown was incomplete." >&2
    fi
    exit 1
}

trap 'handle_deploy_exit $?' EXIT

require_command docker
require_command curl
require_command ip
require_command python3
if ! docker compose version >/dev/null 2>&1; then
    echo "docker compose plugin could not be found. Install it." >&2
    exit 1
fi

require_environment
verify_vpn_binding
verify_root_dockerignore
prepare_compose_secret_files

if [ -f "$DEPLOYMENT_TRANSITION_FILE" ]; then
    recovery_in_progress=1
fi

compose_up_wait postgres valkey minio databasus
run_backend_init

if [ "$recovery_in_progress" -eq 1 ]; then
    recover_incomplete_deployment
    recovery_in_progress=0
fi

previous_slot="$(read_active_slot)"
if [ -z "$previous_slot" ]; then
    target_slot=blue
else
    target_slot="$(other_slot "$previous_slot")"
fi

set_active_slot_environment "$target_slot"

write_deployment_transition
target_started=1
compose_up_wait "$ACTIVE_BACKEND_SLOT" "$ACTIVE_FRONTEND_SLOT" "$ACTIVE_WORKER_SLOT"
switch_scheduler
sync_certificates
preflight_nginx
cutover_attempted=1
compose_up_wait --force-recreate nginx
verify_runtime_restart_policies
smoke_edge
persist_active_slot "$target_slot"
stop_previous_slot "$previous_slot"
cutover_committed=1
clear_deployment_transition

echo "Deployment slot ${target_slot} is active."
