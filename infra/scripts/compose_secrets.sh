#!/usr/bin/env bash

readonly COMPOSE_SECRET_SPECS=(
    "APP_SECRET_KEY app_secret_key COMPOSE_APP_SECRET_KEY_FILE required literal"
    "DB_PASSWORD db_password COMPOSE_DB_PASSWORD_FILE required literal"
    "MINIO_ACCESS_KEY minio_access_key COMPOSE_MINIO_ACCESS_KEY_FILE required literal"
    "MINIO_SECRET_KEY minio_secret_key COMPOSE_MINIO_SECRET_KEY_FILE required literal"
    "SENTRY_DSN sentry_dsn COMPOSE_SENTRY_DSN_FILE allow-empty literal"
)

prepare_compose_secret_files() {
    if [ -z "${repo_dir:-}" ]; then
        echo "repo_dir must be set before sourcing compose_secrets.sh." >&2
        exit 1
    fi

    local compose_secrets_dir="${COMPOSE_SECRETS_DIR:-${repo_dir}/.deploy-state/compose-secrets}"
    local previous_umask
    local spec

    mkdir -p "$compose_secrets_dir"
    chmod 700 "$compose_secrets_dir"

    previous_umask="$(umask)"
    umask 077

    for spec in "${COMPOSE_SECRET_SPECS[@]}"; do
        local source_variable_name
        local secret_file_name
        local compose_file_variable_name
        local empty_policy
        local encoding
        local secret_file_path
        local secret_value

        read -r source_variable_name secret_file_name compose_file_variable_name empty_policy encoding <<<"$spec"

        if [ "${!source_variable_name+x}" != "x" ]; then
            echo "${source_variable_name} must be set before preparing Compose secret files." >&2
            exit 1
        fi

        secret_value="${!source_variable_name}"
        if [ "$empty_policy" = "required" ] && [ -z "$secret_value" ]; then
            echo "${source_variable_name} must not be empty." >&2
            exit 1
        fi

        secret_file_path="${compose_secrets_dir}/${secret_file_name}"
        rm -f "$secret_file_path"
        if [ "$encoding" = "pem" ]; then
            printf '%b' "$secret_value" >"$secret_file_path"
        else
            printf '%s' "$secret_value" >"$secret_file_path"
        fi
        # Compose bind-mounts file-backed secrets with host ownership, so non-root containers
        # need a read bit that is independent of the host UID/GID.
        chmod 444 "$secret_file_path"
        export "$compose_file_variable_name=$secret_file_path"
    done

    validate_compose_pki "$compose_secrets_dir"

    umask "$previous_umask"
}
