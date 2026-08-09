#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd -- "${script_dir}/../.." && pwd)"
check_suffix="$(date +%s)-$$"
temp_dir="$(mktemp -d)"
minio_image="personal-workspace-minio-security-check:${check_suffix}"
nginx_image="personal-workspace-nginx-security-check:${check_suffix}"
nginx_container="personal-workspace-nginx-security-check-${check_suffix}"
nginx_recovery_container="personal-workspace-nginx-recovery-check-${check_suffix}"
nginx_network="personal-workspace-nginx-security-check-${check_suffix}"
minio_image_may_exist=0
nginx_image_may_exist=0
nginx_container_may_exist=0
nginx_recovery_container_may_exist=0
nginx_network_may_exist=0

remove_container_if_present() {
    local container_name="$1"
    local output

    if output="$(docker rm -f "$container_name" 2>&1)"; then
        return
    fi
    if [[ "$output" == *"No such container"* ]]; then
        return
    fi
    echo "Container cleanup failed for ${container_name}: ${output}" >&2
    return 1
}

remove_network_if_present() {
    local network_name="$1"
    local output

    if output="$(docker network rm "$network_name" 2>&1)"; then
        return
    fi
    if [[ "$output" == *"not found"* ]]; then
        return
    fi
    echo "Network cleanup failed for ${network_name}: ${output}" >&2
    return 1
}

remove_image_if_present() {
    local image_ref="$1"
    local output

    if output="$(docker image rm "$image_ref" 2>&1)"; then
        return
    fi
    if [[ "$output" == *"No such image"* ]]; then
        return
    fi
    echo "Image cleanup failed for ${image_ref}: ${output}" >&2
    return 1
}

cleanup() {
    local cleanup_status=0

    if [ "$nginx_container_may_exist" -eq 1 ] \
        && ! remove_container_if_present "$nginx_container"; then
        cleanup_status=1
    fi
    if [ "$nginx_recovery_container_may_exist" -eq 1 ] \
        && ! remove_container_if_present "$nginx_recovery_container"; then
        cleanup_status=1
    fi
    if [ "$nginx_network_may_exist" -eq 1 ] \
        && ! remove_network_if_present "$nginx_network"; then
        cleanup_status=1
    fi
    if [ "$minio_image_may_exist" -eq 1 ] \
        && ! remove_image_if_present "$minio_image"; then
        cleanup_status=1
    fi
    if [ "$nginx_image_may_exist" -eq 1 ] \
        && ! remove_image_if_present "$nginx_image"; then
        cleanup_status=1
    fi
    if ! rm -rf -- "$temp_dir"; then
        echo "Runtime-check temporary directory cleanup failed." >&2
        cleanup_status=1
    fi
    return "$cleanup_status"
}

handle_exit() {
    local original_status="$1"
    local cleanup_status

    trap - EXIT
    set +e
    cleanup
    cleanup_status=$?
    set -e
    if [ "$original_status" -eq 0 ] && [ "$cleanup_status" -ne 0 ]; then
        original_status="$cleanup_status"
    fi
    exit "$original_status"
}

trap 'handle_exit $?' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "$1 could not be found." >&2
        exit 2
    fi
}

require_command docker
require_command openssl
# shellcheck source=docker_context.sh
. "$script_dir/docker_context.sh"
verify_root_dockerignore

mkdir -p "${temp_dir}/minio-secrets" "${temp_dir}/certs"
printf '%s' 'minio-check-user' >"${temp_dir}/minio-secrets/minio_access_key"
printf '%s' 'minio-check-password' >"${temp_dir}/minio-secrets/minio_secret_key"
chmod 755 "${temp_dir}/minio-secrets"
chmod 444 "${temp_dir}/minio-secrets/"*

minio_image_may_exist=1
docker build -f "${repo_dir}/infra/minio/Dockerfile" -t "$minio_image" "$repo_dir"
docker run --rm \
    --read-only \
    --cap-drop ALL \
    --security-opt no-new-privileges \
    --user 10002:10002 \
    -v "${temp_dir}/minio-secrets:/run/secrets:ro" \
    "$minio_image" server --help >"${temp_dir}/minio-help.txt"
grep -Fq 'NAME:' "${temp_dir}/minio-help.txt"
docker run --rm --user 10002:10002 --entrypoint sh "$minio_image" \
    -c 'test "$(id -u):$(id -g)" = "10002:10002" && test -w /data'

openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "${temp_dir}/certs/privkey.pem" \
    -out "${temp_dir}/certs/fullchain.pem" \
    -days 1 -subj '/CN=example.test' >/dev/null 2>&1
chmod 644 "${temp_dir}/certs/"*.pem

nginx_image_may_exist=1
docker build -f "${repo_dir}/infra/nginx/Dockerfile" -t "$nginx_image" "$repo_dir"
nginx_network_may_exist=1
docker network create "$nginx_network" >/dev/null
docker run --rm \
    --network "$nginx_network" \
    --read-only \
    --cap-drop ALL \
    --security-opt no-new-privileges \
    --tmpfs /tmp:mode=1777,uid=101,gid=101 \
    --user 101:101 \
    -e APP_DOMAIN=example.test \
    -e SSL_CERT=/certs/fullchain.pem \
    -e SSL_KEY=/certs/privkey.pem \
    -e ACTIVE_BACKEND_SLOT=backend-blue \
    -e ACTIVE_FRONTEND_SLOT=frontend-blue \
    -e NGINX_VALIDATE_ONLY=1 \
    -v "${temp_dir}/certs:/certs:ro" \
    "$nginx_image" /usr/local/bin/personal-workspace-nginx-entrypoint

nginx_container_may_exist=1
docker run -d \
    --name "$nginx_container" \
    --network "$nginx_network" \
    --read-only \
    --cap-drop ALL \
    --security-opt no-new-privileges \
    --tmpfs /tmp:mode=1777,uid=101,gid=101 \
    --user 101:101 \
    -e APP_DOMAIN=example.test \
    -e SSL_CERT=/certs/fullchain.pem \
    -e SSL_KEY=/certs/privkey.pem \
    -e ACTIVE_BACKEND_SLOT=backend-blue \
    -e ACTIVE_FRONTEND_SLOT=frontend-blue \
    -e NGINX_LIVENESS_FAILURE_LIMIT=2 \
    -v "${temp_dir}/certs:/certs:ro" \
    "$nginx_image" /usr/local/bin/personal-workspace-nginx-entrypoint >/dev/null

for attempt in 1 2 3 4 5; do
    if docker exec "$nginx_container" \
        /usr/local/bin/personal-workspace-nginx-healthcheck >/dev/null 2>&1; then
        break
    fi
    if [ "$attempt" -eq 5 ]; then
        echo "nginx liveness endpoint did not become healthy." >&2
        docker logs "$nginx_container" >&2
        exit 1
    fi
    sleep 1
done

nginx_recovery_container_may_exist=1
docker run -d \
    --name "$nginx_recovery_container" \
    --restart always \
    --read-only \
    --cap-drop ALL \
    --security-opt no-new-privileges \
    --tmpfs /tmp:mode=1777,uid=101,gid=101 \
    --user 101:101 \
    -e NGINX_LIVENESS_FAILURE_LIMIT=2 \
    --entrypoint sh \
    "$nginx_image" -c 'trap "exit 0" TERM; while :; do sleep 1; done' >/dev/null

docker exec "$nginx_recovery_container" \
    /usr/local/bin/personal-workspace-nginx-healthcheck >/dev/null 2>&1 || true
docker exec "$nginx_recovery_container" \
    /usr/local/bin/personal-workspace-nginx-healthcheck >/dev/null 2>&1 || true
for attempt in 1 2 3 4 5; do
    restart_count="$(docker inspect -f '{{.RestartCount}}' "$nginx_recovery_container")"
    if [ "$restart_count" -ge 1 ] \
        && [ "$(docker inspect -f '{{.State.Running}}' "$nginx_recovery_container")" = "true" ]; then
        exit 0
    fi
    sleep 1
done

echo "nginx did not restart after the configured liveness failure limit." >&2
exit 1
