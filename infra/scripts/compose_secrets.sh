#!/usr/bin/env bash

readonly COMPOSE_SECRET_SPECS=(
    "DB_PASSWORD db_password COMPOSE_DB_PASSWORD_FILE required"
    "MINIO_ACCESS_KEY minio_access_key COMPOSE_MINIO_ACCESS_KEY_FILE required"
    "MINIO_SECRET_KEY minio_secret_key COMPOSE_MINIO_SECRET_KEY_FILE required"
    "SENTRY_DSN sentry_dsn COMPOSE_SENTRY_DSN_FILE allow-empty"
)

is_unchanged_secret_placeholder() {
    case "$1" in
        replace-with-* | CHANGE_ME | CHANGEME | __REPLACE_ME__) return 0 ;;
        *) return 1 ;;
    esac
}

sentry_is_enabled() {
    case "${SENTRY_USE:-false}" in
        1 | true | TRUE | True | yes | YES | Yes | on | ON | On) return 0 ;;
        *) return 1 ;;
    esac
}

prepare_compose_secret_files() {
    if [ -z "${repo_dir:-}" ]; then
        echo "repo_dir must be set before sourcing compose_secrets.sh." >&2
        exit 1
    fi

    local spec

    for spec in "${COMPOSE_SECRET_SPECS[@]}"; do
        local source_variable_name
        local secret_file_name
        local compose_file_variable_name
        local empty_policy
        local secret_value

        read -r source_variable_name secret_file_name compose_file_variable_name empty_policy <<<"$spec"
        if [ "${!source_variable_name+x}" != "x" ]; then
            echo "${source_variable_name} must be set before preparing Compose secret files." >&2
            exit 1
        fi

        secret_value="${!source_variable_name}"
        if [ "$empty_policy" = "required" ] && [ -z "$secret_value" ]; then
            echo "${source_variable_name} must not be empty." >&2
            exit 1
        fi
        if is_unchanged_secret_placeholder "$secret_value"; then
            echo "${source_variable_name} still contains an example placeholder." >&2
            exit 1
        fi
        if [ "$source_variable_name" = "SENTRY_DSN" ] \
            && sentry_is_enabled \
            && [ -z "${secret_value//[[:space:]]/}" ]; then
            echo "SENTRY_DSN must not be empty when SENTRY_USE is enabled." >&2
            exit 1
        fi
    done

    local compose_secrets_dir="${COMPOSE_SECRETS_DIR:-${repo_dir}/.deploy-state/compose-secrets}"
    local previous_umask

    mkdir -p "$compose_secrets_dir"
    chmod 700 "$compose_secrets_dir"
    previous_umask="$(umask)"
    umask 077

    for spec in "${COMPOSE_SECRET_SPECS[@]}"; do
        local source_variable_name
        local secret_file_name
        local compose_file_variable_name
        local empty_policy
        local secret_file_path
        local secret_value

        read -r source_variable_name secret_file_name compose_file_variable_name empty_policy <<<"$spec"
        secret_value="${!source_variable_name}"

        secret_file_path="${compose_secrets_dir}/${secret_file_name}"
        rm -f "$secret_file_path"
        printf '%s' "$secret_value" >"$secret_file_path"
        chmod 444 "$secret_file_path"
        export "$compose_file_variable_name=$secret_file_path"
    done

    umask "$previous_umask"
}
