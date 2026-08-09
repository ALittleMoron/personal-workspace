#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd -- "${script_dir}/../.." && pwd)"
cd "$repo_dir"

if [ "${PERSONAL_WORKSPACE_RUNTIME_ENV_LOADED:-}" != "1" ]; then
    exec python3 "$script_dir/runtime_env.py" exec --path "$repo_dir/.env" \
        bash "$script_dir/tls.sh" "$@"
fi

# shellcheck source=compose_secrets.sh
. "$script_dir/compose_secrets.sh"

require_env() {
    if [ -z "${!1:-}" ]; then
        echo "$1 must be set in .env." >&2
        exit 1
    fi
}

require_env APP_DOMAIN
require_env LE_EMAIL
prepare_compose_secret_files

nginx_is_running() {
    docker compose ps --services --status running | grep -Fxq nginx
}

sync_certificates() {
    docker compose run --rm cert-sync
}

reload_nginx_if_running() {
    if nginx_is_running; then
        docker compose exec -T nginx nginx -s reload
    fi
}

issue_certificates() {
    local -a compose_options=(run --rm)
    local -a challenge_options
    if nginx_is_running; then
        challenge_options=(--webroot --webroot-path=/var/www/certbot)
    else
        compose_options+=(--service-ports)
        challenge_options=(--standalone --preferred-challenges http)
    fi
    docker compose "${compose_options[@]}" certbot certonly "${challenge_options[@]}" \
        --email "$LE_EMAIL" --agree-tos --non-interactive --no-eff-email \
        --keep-until-expiring --cert-name "$APP_DOMAIN" -d "$APP_DOMAIN"
    sync_certificates
    reload_nginx_if_running
}

case "${1:?action is required}" in
    issue) issue_certificates ;;
    renew)
        docker compose run --rm certbot renew --webroot --webroot-path=/var/www/certbot
        sync_certificates
        reload_nginx_if_running
        ;;
    sync)
        sync_certificates
        reload_nginx_if_running
        ;;
    *)
        echo "Unknown TLS action: $1" >&2
        exit 2
        ;;
esac
