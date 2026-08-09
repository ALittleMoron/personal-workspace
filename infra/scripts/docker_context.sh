#!/usr/bin/env bash

verify_root_dockerignore() {
    if [ -z "${repo_dir:-}" ]; then
        echo "repo_dir must be set before sourcing docker_context.sh." >&2
        return 1
    fi

    local dockerignore_path="${repo_dir}/.dockerignore"
    local required_pattern
    local required_patterns=(
        .env '**/.env' '**/.env.*'
        .deploy-state .deploy-payload
        '*.pem' '*.key' '*.crt'
        '**/*.pem' '**/*.key' '**/*.crt'
        certs '**/certs'
    )

    if [ ! -f "$dockerignore_path" ]; then
        echo "Root .dockerignore is required before a root-context image build." >&2
        return 1
    fi
    for required_pattern in "${required_patterns[@]}"; do
        if ! grep -Fxq -- "$required_pattern" "$dockerignore_path"; then
            echo "Root .dockerignore is missing required exclusion: ${required_pattern}" >&2
            return 1
        fi
    done
}
