#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd -- "${script_dir}/../.." && pwd)"
cd "$repo_dir"

require_file_contains() {
    if ! grep -Fq -- "$2" "$1"; then
        echo "Missing $3 in $1: $2" >&2
        exit 1
    fi
}

require_file_not_contains() {
    if grep -Fq -- "$2" "$1"; then
        echo "Unexpected $3 in $1: $2" >&2
        exit 1
    fi
}

require_exact_line_before() {
    local file="$1"
    local first_line="$2"
    local second_line="$3"
    local description="$4"
    local first_number
    local second_number

    first_number="$(grep -nFx -- "$first_line" "$file" | tail -n 1 | cut -d: -f1 || true)"
    second_number="$(grep -nFx -- "$second_line" "$file" | tail -n 1 | cut -d: -f1 || true)"
    if [ -z "$first_number" ] || [ -z "$second_number" ] || [ "$first_number" -ge "$second_number" ]; then
        echo "Invalid ordering for ${description} in ${file}." >&2
        exit 1
    fi
}

for required_file in \
    docker-compose.yml docker-compose.test.yml \
    infra/nginx/nginx.conf infra/nginx/templates/site.conf.template \
    infra/deploy/runtime-env.manifest.json infra/scripts/active_slot_state.py \
    infra/scripts/deployment_transition_state.py \
    infra/scripts/check_compose_security.py infra/scripts/check_workflow_actions.rb; do
    if [ ! -f "$required_file" ]; then
        echo "Missing infrastructure file: $required_file" >&2
        exit 1
    fi
done

require_file_contains docker-compose.yml 'internal: true' "internal application network"
require_file_contains docker-compose.yml '"${VPN_BIND_ADDRESS}:18081:18081"' "private MinIO panel binding"
require_file_contains docker-compose.yml '"${VPN_BIND_ADDRESS}:18082:18082"' "private backup panel binding"
require_file_contains docker-compose.yml 'restart: always' "edge restart policy"
require_file_contains docker-compose.yml 'taskiq-scheduler-blue:' "blue scheduler service"
require_file_contains docker-compose.yml 'taskiq-scheduler-green:' "green scheduler service"
require_file_contains docker-compose.yml 'cap_drop:' "capability dropping"
require_file_contains docker-compose.yml 'no-new-privileges:true' "privilege escalation protection"
require_file_not_contains docker-compose.yml '9000:9000' "published object API"
require_file_not_contains docker-compose.yml '9001:9001' "directly published MinIO panel"
require_file_not_contains docker-compose.yml '4005:4005' "directly published backup panel"
require_file_not_contains docker-compose.yml 'network_mode: host' "host networking"
require_file_not_contains docker-compose.yml 'privileged: true' "privileged container"

scheduler_count="$(grep -Ec '^  taskiq-scheduler-(blue|green):$' docker-compose.yml)"
if [ "$scheduler_count" -ne 2 ]; then
    echo "Compose must define exactly two slot-scoped TaskIQ scheduler services." >&2
    exit 1
fi

require_file_contains infra/nginx/templates/site.conf.template 'location /api/ {' "API proxy"
require_file_contains infra/nginx/templates/site.conf.template 'location / {' "frontend proxy"
require_file_contains infra/nginx/templates/site.conf.template 'proxy_pass http://frontend;' "CSR origin proxy"
require_file_contains infra/nginx/templates/site.conf.template \
    'Do not replace, merge, or cache those response headers here.' "origin CSP ownership"
require_file_not_contains infra/nginx/templates/site.conf.template 'proxy_pass http://minio_api' \
    "public object proxy"

# shellcheck source=docker_context.sh
. "$script_dir/docker_context.sh"
verify_root_dockerignore
require_file_contains infra/scripts/run.sh 'verify_root_dockerignore' "root build-context preflight"
require_exact_line_before infra/scripts/run.sh 'verify_root_dockerignore' \
    'prepare_compose_secret_files' "Docker context check before secret materialization"
require_exact_line_before infra/scripts/docker_image_security.sh '    verify_root_dockerignore' \
    'docker build -f "${repo_dir}/${dockerfile}" -t "$image_ref" "${repo_dir}/${build_context}"' \
    "Docker context check before image build"

require_file_contains infra/nginx/entrypoint.sh 'NGINX_VALIDATE_ONLY' "nginx preflight mode"
require_file_contains infra/nginx/entrypoint.sh 'exec nginx -t' "nginx configuration validation"
require_file_contains infra/scripts/run.sh "trap 'handle_deploy_exit \$?' EXIT" \
    "post-cutover rollback trap"
require_file_contains infra/scripts/run.sh 'nginx fail-closed' "explicit fail-closed evidence"
require_file_contains infra/scripts/run.sh 'remove_service_strict nginx' \
    "confirmed fail-closed edge removal"
require_file_contains infra/scripts/run.sh 'docker compose rm --stop --force "$service_name"' \
    "restart-proof fail-closed service removal"
require_file_contains infra/scripts/active_slot_state.py 'os.replace(temporary_path, path)' \
    "atomic active-slot replacement"
require_file_contains infra/scripts/active_slot_state.py 'os.fsync(stream.fileno())' \
    "active-slot file fsync"
require_file_contains infra/scripts/active_slot_state.py 'fsync_directory(path.parent)' \
    "active-slot parent directory fsync"
require_file_contains infra/scripts/deployment_transition_state.py \
    'os.replace(temporary_path, path)' "atomic deployment-transition replacement"
require_file_contains infra/scripts/deployment_transition_state.py \
    'os.fsync(stream.fileno())' "deployment-transition file fsync"
require_file_contains infra/scripts/deployment_transition_state.py \
    'fsync_directory(path.parent)' "deployment-transition parent directory fsync"
require_file_contains infra/scripts/run.sh 'recover_incomplete_deployment' \
    "interrupted deployment recovery"
require_file_contains infra/scripts/run.sh \
    'Interrupted deployment recovery failed; stopping both slots and nginx fail-closed.' \
    "failed recovery fail-closed path"
require_file_contains infra/scripts/run.sh 'persist_active_slot "$previous_slot"' \
    "rollback active-slot restore"
require_file_contains infra/scripts/run.sh 'clear_active_slot_state' \
    "first-deploy and fail-closed active-slot removal"
require_file_contains infra/scripts/active_slot_state.py 'Target active-slot write failed.' \
    "target active-slot write self-test"
require_file_contains infra/scripts/active_slot_state.py 'Rollback active-slot restore failed.' \
    "rollback active-slot restore self-test"
require_file_contains infra/scripts/active_slot_state.py 'First-deploy active-slot removal failed.' \
    "first-deploy active-slot removal self-test"
require_file_contains infra/scripts/active_slot_state.py 'Fail-closed active-slot removal failed.' \
    "fail-closed active-slot removal self-test"
require_exact_line_before infra/scripts/run.sh 'preflight_nginx' 'cutover_attempted=1' \
    "nginx preflight before cutover"
require_exact_line_before infra/scripts/run.sh 'cutover_attempted=1' \
    'compose_up_wait --force-recreate nginx' "cutover trap arming before nginx replacement"
require_exact_line_before infra/scripts/run.sh 'verify_runtime_restart_policies' 'smoke_edge' \
    "restart-policy gate before edge smoke checks"
require_exact_line_before infra/scripts/run.sh 'smoke_edge' 'persist_active_slot "$target_slot"' \
    "edge gates before active-slot update"
require_exact_line_before infra/scripts/run.sh 'write_deployment_transition' \
    'target_started=1' "durable transition before target startup"
require_exact_line_before infra/scripts/run.sh 'persist_active_slot "$target_slot"' \
    'stop_previous_slot "$previous_slot"' "active-slot update before previous-slot cleanup"
require_exact_line_before infra/scripts/run.sh \
    'stop_previous_slot "$previous_slot"' 'cutover_committed=1' \
    "previous-slot cleanup before commit"
require_exact_line_before infra/scripts/run.sh 'cutover_committed=1' \
    'clear_deployment_transition' "commit before transition removal"
require_exact_line_before infra/scripts/run.sh \
    '    echo "Stopping both slots and nginx fail-closed before removing deployment state." >&2' \
    '    if ! clear_active_slot_state; then' "fail-closed active-slot removal"
require_exact_line_before infra/scripts/run.sh '    stop_all_slots_strict || cleanup_status=1' \
    '    if ! clear_active_slot_state; then' "fail-closed active-slot removal"
python3 infra/scripts/active_slot_state.py self-test
python3 infra/scripts/deployment_transition_state.py self-test
python3 infra/scripts/runtime_env.py self-test
python3 infra/scripts/render_deploy_env.py --self-test
require_file_contains infra/scripts/run.sh 'switch_scheduler' "single active scheduler switch"
require_file_contains infra/scripts/run.sh 'restore_previous_scheduler' \
    "scheduler rollback restoration"
require_file_contains infra/scripts/run.sh \
    'wait_for_service_health "taskiq-scheduler-${previous_slot}" || return 1' \
    "scheduler recovery health propagation"
require_file_contains infra/scripts/run.sh 'stop_service_strict "$ACTIVE_SCHEDULER_SLOT"' \
    "confirmed target scheduler stop before rollback"
require_file_contains infra/scripts/run.sh \
    'stop_service_strict "taskiq-scheduler-${previous_slot}"' \
    "confirmed previous scheduler stop before switch"
require_file_contains infra/scripts/tests_compose.sh \
    "trap 'exit_with_cleanup \$? cleanup_owned_test_db' EXIT" \
    "compose test cleanup status propagation"
require_file_contains backend/scripts/test.sh \
    "trap 'exit_with_cleanup \$? cleanup_test_resources' EXIT" \
    "backend test cleanup status propagation"
require_file_not_contains infra/scripts/run.sh '--user 0:0' \
    "live MinIO volume ownership mutation"
require_file_contains infra/scripts/stop.sh 'active_slot_state.py" clear' \
    "active-slot cleanup after full stack stop"
require_file_contains infra/scripts/stop.sh 'deployment_transition_state.py" clear' \
    "deployment-transition cleanup after full stack stop"
require_file_contains infra/scripts/stop.sh 'down --remove-orphans' \
    "orphan cleanup before active-slot removal"

for runtime_script in infra/scripts/run.sh infra/scripts/stop.sh infra/scripts/tls.sh; do
    require_file_contains "$runtime_script" 'runtime_env.py' "non-evaluating runtime env loader"
    require_file_not_contains "$runtime_script" '. "$repo_dir/.env"' "shell-sourced runtime environment"
done
require_file_contains infra/scripts/render_deploy_env.py 'os.replace(temporary_path, path)' \
    "atomic runtime environment replacement"
require_file_contains infra/scripts/render_deploy_env.py 'os.fchmod(descriptor, 0o600)' \
    "private runtime environment creation"
require_file_contains infra/scripts/runtime_env.py 'os.execvpe' "data-only runtime environment execution"
require_file_contains infra/scripts/runtime_env.py 'COMPOSE_DISABLE_ENV_FILE' \
    "Compose implicit env parsing disablement"
require_file_contains infra/scripts/runtime_env.py 'SUBSTITUTION' "literal command-substitution self-test"
require_file_contains infra/scripts/runtime_env.py 'TRAILING_BACKSLASH' \
    "literal trailing-backslash self-test"

require_file_contains .env.example 'VPN_INTERFACE=wg0' "declared WireGuard interface"
for secret_name in DB_PASSWORD MINIO_ACCESS_KEY MINIO_SECRET_KEY; do
    if ! grep -Fxq -- "${secret_name}=" .env.example; then
        echo "Production secret example must be blank: ${secret_name}." >&2
        exit 1
    fi
done
require_file_not_contains .env.example 'replace-with-a-strong-' \
    "copyable production credential placeholder"
require_file_contains infra/scripts/run.sh 'IMAGE_TAG must not use the mutable latest tag.' \
    "runtime latest-tag rejection"
require_file_contains infra/scripts/compose_secrets.sh 'is_unchanged_secret_placeholder' \
    "unchanged secret placeholder rejection"
require_file_contains infra/scripts/compose_secrets.sh \
    'SENTRY_DSN must not be empty when SENTRY_USE is enabled.' \
    "enabled Sentry DSN pre-materialization validation"
require_file_contains infra/scripts/run.sh 'ip -json -details link show dev "$VPN_INTERFACE"' \
    "unprivileged WireGuard link verification"
require_file_contains infra/scripts/run.sh 'not isinstance(flags, list) or "UP" not in flags' \
    "administratively active VPN interface verification"
require_file_contains infra/scripts/run.sh 'link_info.get("info_kind") != "wireguard"' \
    "WireGuard link-kind verification"
require_file_contains infra/scripts/run.sh 'ip -o -4 address show dev "$VPN_INTERFACE"' \
    "local VPN address verification"
require_file_contains infra/scripts/run.sh 'address.is_loopback' "loopback VPN bind rejection"
require_file_not_contains infra/scripts/run.sh 'wg show' "privileged WireGuard inspection"

if ! command -v ruby >/dev/null 2>&1; then
    echo "ruby is required for YAML-aware workflow validation." >&2
    exit 2
fi
workflow_files=()
while IFS= read -r workflow_file; do
    workflow_files+=("$workflow_file")
done < <(find .github/workflows -maxdepth 1 -type f \
    \( -name '*.yaml' -o -name '*.yml' \) -print | sort)
if [ "${#workflow_files[@]}" -eq 0 ]; then
    echo "No GitHub workflows were found." >&2
    exit 1
fi
ruby infra/scripts/check_workflow_actions.rb "${workflow_files[@]}"
require_file_not_contains .github/workflows/_deploy.yaml 'GITHUB_SECRETS_JSON' \
    "whole secret context renderer input"
require_file_contains .github/workflows/_deploy.yaml 'cancel-in-progress: false' \
    "non-canceling deployment concurrency"
rsync_switches_block="$(sed -n '/^[[:space:]]*switches: >-$/,/^[[:space:]]*path: /p' \
    .github/workflows/_deploy.yaml)"
rsync_path_argument="$(sed -n 's/^[[:space:]]*//; /^--rsync-path=/p' \
    <<<"$rsync_switches_block")"
expected_rsync_path_argument='--rsync-path=${{vars.REMOTE_PATH}}/.deploy-state/rsync-with-deploy-lock'
if [ "$rsync_path_argument" != "$expected_rsync_path_argument" ] \
    || [[ "$rsync_path_argument" =~ [[:space:]] ]]; then
    echo "Deploy rsync path must be exactly one no-whitespace wrapper argv token." >&2
    exit 1
fi
require_file_not_contains .github/workflows/_deploy.yaml '--rsync-path="' \
    "quoted whitespace-containing rsync path argument"
deploy_state_exclude_argument="$(sed -n \
    's/^[[:space:]]*//; /^--exclude=.*\.deploy-state$/p' <<<"$rsync_switches_block")"
if [ "$deploy_state_exclude_argument" != '--exclude=.deploy-state' ] \
    || grep -Fq -- '--exclude .deploy-state' <<<"$rsync_switches_block" \
    || grep -Fq -- "--exclude '.deploy-state'" <<<"$rsync_switches_block" \
    || grep -Fq -- '--exclude ".deploy-state"' <<<"$rsync_switches_block" \
    || grep -Fq -- "--exclude='.deploy-state'" <<<"$rsync_switches_block" \
    || grep -Fq -- '--exclude=".deploy-state"' <<<"$rsync_switches_block"; then
    echo "Deploy-state rsync exclusion must be exactly one unquoted argv token." >&2
    exit 1
fi
if [ "$(grep -Fc 'case "$REMOTE_PATH" in' .github/workflows/_deploy.yaml)" -ne 2 ]; then
    echo "REMOTE_PATH must be validated locally and by the remote wrapper provisioner." >&2
    exit 1
fi
require_file_contains .github/workflows/_deploy.yaml \
    '/|*/|*//*|*/./*|*/../*|*/.|*/..|*[!A-Za-z0-9_./-]*)' \
    "normalized no-whitespace remote path validation"
require_exact_line_before .github/workflows/_deploy.yaml \
    '      - name: Provision remote rsync lock wrapper' \
    '      - name: Sync runtime files' "wrapper provisioning before payload sync"
require_file_contains .github/workflows/_deploy.yaml \
    'temporary_path="$(mktemp "$deploy_state_dir/.rsync-with-deploy-lock.XXXXXX")"' \
    "same-directory temporary rsync wrapper"
require_file_contains .github/workflows/_deploy.yaml \
    'mv -f -- "$temporary_path" "$wrapper_path"' "atomic rsync wrapper replacement"
require_file_contains .github/workflows/_deploy.yaml 'chmod 700 "$temporary_path"' \
    "executable private rsync wrapper"
require_file_contains .github/workflows/_deploy.yaml 'exec 9>"$wrapper_dir/deploy.lock"' \
    "rsync wrapper deploy-lock descriptor"
require_file_contains .github/workflows/_deploy.yaml "'flock 9'" \
    "rsync wrapper lock acquisition"
require_file_contains .github/workflows/_deploy.yaml 'exec rsync "$@"' \
    "rsync exec with preserved argv and lock descriptor"
rsync_lock_count="$(grep -Fc 'exec 9>"$wrapper_dir/deploy.lock"' \
    .github/workflows/_deploy.yaml)"
tls_lock_count="$(grep -Fc 'exec flock .deploy-state/deploy.lock make certbot-issue' \
    .github/workflows/_deploy.yaml)"
start_lock_count="$(grep -Fc 'exec flock .deploy-state/deploy.lock make run' \
    .github/workflows/_deploy.yaml)"
if [ "$rsync_lock_count" -ne 1 ] || [ "$tls_lock_count" -ne 1 ] \
    || [ "$start_lock_count" -ne 1 ] \
    || [ "$((rsync_lock_count + tls_lock_count + start_lock_count))" -ne 3 ]; then
    echo "Deploy must define exactly one rsync, TLS, and start mutation lock contour." >&2
    exit 1
fi
render_secret_block="$(sed -n '/- name: Render runtime environment/,/run: >/p' \
    .github/workflows/_deploy.yaml)"
if [ "$(grep -Fc '${{ secrets.' <<<"$render_secret_block")" -ne 4 ]; then
    echo "The runtime renderer must receive exactly four explicit secrets." >&2
    exit 1
fi
if grep -Fq 'SSH_PRIVATE_KEY' <<<"$render_secret_block"; then
    echo "SSH_PRIVATE_KEY must not be exposed to the runtime renderer." >&2
    exit 1
fi
for secret_name in DB_PASSWORD MINIO_ACCESS_KEY MINIO_SECRET_KEY SENTRY_DSN; do
    require_file_contains .github/workflows/_deploy.yaml \
        "          ${secret_name}: \${{ secrets.${secret_name} }}" \
        "explicit runtime secret ${secret_name}"
done
require_file_contains .github/workflows/_deploy.yaml 'cp -a Makefile docker-compose.yml .dockerignore' \
    "root Docker ignore deploy payload"
if [ "$(grep -Fc "test \"\$(stat -c '%a' .env)\" = \"600\"" \
    .github/workflows/_deploy.yaml)" -ne 2 ]; then
    echo "Deploy must verify runtime environment mode locally and remotely." >&2
    exit 1
fi
if [ "$(grep -Fc "test \"\$(stat -c '%u' .env)\" = \"\$(id -u)\"" \
    .github/workflows/_deploy.yaml)" -ne 2 ]; then
    echo "Deploy must verify runtime environment ownership locally and remotely." >&2
    exit 1
fi

require_file_contains frontend/scripts/npm_task.sh 'bash "$script_dir/npm_task.sh" format-check' \
    "read-only aggregate frontend formatting"
require_file_contains infra/scripts/docker_lint.sh 'hadolint --failure-threshold warning' \
    "Hadolint warning threshold"
require_file_contains infra/scripts/docker_lint.sh \
    'hadolint/hadolint:v2.14.0@sha256:27086352fd5e1907ea2b934eb1023f217c5ae087992eb59fde121dce9c9ff21e' \
    "immutable Hadolint image"
require_file_contains infra/scripts/docker_lint.sh \
    'goodwithtech/dockle:v0.4.15@sha256:eade932f793742de0aa8755406c7677cd7696f8675b6180926f7eeffa7abe6b9' \
    "immutable Dockle image"
require_file_contains infra/scripts/docker_lint.sh 'require_pinned_image "$hadolint_image"' \
    "Hadolint override digest enforcement"
require_file_contains infra/scripts/docker_lint.sh 'require_pinned_image "$dockle_image"' \
    "Dockle override digest enforcement"

if grep -ERn '(^|[[:space:]])image:[[:space:]]+[^[:space:]]+:latest([[:space:]]|$)' \
    docker-compose.yml docker-compose.test.yml infra .github/workflows \
    --include='Dockerfile' --include='*.yml' --include='*.yaml'; then
    echo "Unpinned latest image tag found." >&2
    exit 1
fi

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    temp_dir="$(mktemp -d)"
    trap 'rm -rf "$temp_dir"' EXIT
    for secret_name in db_password minio_access_key minio_secret_key sentry_dsn; do
        : >"${temp_dir}/${secret_name}"
    done
    export COMPOSE_DB_PASSWORD_FILE="${temp_dir}/db_password"
    export COMPOSE_MINIO_ACCESS_KEY_FILE="${temp_dir}/minio_access_key"
    export COMPOSE_MINIO_SECRET_KEY_FILE="${temp_dir}/minio_secret_key"
    export COMPOSE_SENTRY_DSN_FILE="${temp_dir}/sentry_dsn"
    docker compose --profile '*' --env-file .env.example config --format json \
        >"${temp_dir}/compose.json"
    python3 infra/scripts/check_compose_security.py \
        --compose-json "${temp_dir}/compose.json" --mode production \
        --db-password-file "$COMPOSE_DB_PASSWORD_FILE" \
        --minio-access-key-file "$COMPOSE_MINIO_ACCESS_KEY_FILE" \
        --minio-secret-key-file "$COMPOSE_MINIO_SECRET_KEY_FILE" \
        --sentry-dsn-file "$COMPOSE_SENTRY_DSN_FILE"
    docker compose --env-file .env.test -f docker-compose.test.yml config --format json \
        >"${temp_dir}/compose-test.json"
    python3 infra/scripts/check_compose_security.py \
        --compose-json "${temp_dir}/compose-test.json" --mode test
    bash infra/scripts/container_runtime_check.sh
else
    echo "docker compose is required for the infrastructure security check." >&2
    exit 2
fi

echo "Infrastructure configuration invariants passed."
