#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd -- "${script_dir}/../.." && pwd)"

hadolint_image="${HADOLINT_IMAGE:-hadolint/hadolint:v2.14.0@sha256:27086352fd5e1907ea2b934eb1023f217c5ae087992eb59fde121dce9c9ff21e}"
dockle_image="${DOCKLE_IMAGE:-goodwithtech/dockle:v0.4.15@sha256:eade932f793742de0aa8755406c7677cd7696f8675b6180926f7eeffa7abe6b9}"
dockle_exit_level="${DOCKLE_EXIT_LEVEL:-warn}"
dockle_accept_keys="${DOCKLE_ACCEPT_KEYS:-KEY_SHA512}"
dockle_accept_files="${DOCKLE_ACCEPT_FILES:-settings.py}"
dockle_ignore_codes="${DOCKLE_IGNORE_CODES:-DKL-DI-0005}"
dockerfiles=(backend/Dockerfile frontend/Dockerfile infra/minio/Dockerfile infra/nginx/Dockerfile)

require_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        echo "docker could not be found." >&2
        exit 2
    fi
}

require_pinned_image() {
    local image_ref="$1"

    if [[ ! "$image_ref" =~ @sha256:[0-9a-f]{64}$ ]]; then
        echo "Tool image must use an immutable sha256 digest: ${image_ref}" >&2
        exit 2
    fi
}

run_hadolint() {
    require_docker
    require_pinned_image "$hadolint_image"
    docker run --rm -v "${repo_dir}:/workspace:ro" -w /workspace "$hadolint_image" \
        hadolint --failure-threshold warning "${dockerfiles[@]}"
}

run_dockle() {
    local image_ref
    local -a dockle_args=()
    local item

    require_docker
    require_pinned_image "$dockle_image"
    if [ "$#" -eq 0 ]; then
        echo "At least one image reference is required for Dockle." >&2
        exit 2
    fi

    IFS=,
    for item in $dockle_accept_keys; do dockle_args+=(--accept-key "$item"); done
    for item in $dockle_accept_files; do dockle_args+=(--accept-file "$item"); done
    for item in $dockle_ignore_codes; do dockle_args+=(--ignore "$item"); done
    unset IFS

    for image_ref in "$@"; do
        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock "$dockle_image" \
            --exit-code 1 --exit-level "$dockle_exit_level" "${dockle_args[@]}" "$image_ref"
    done
}

case "${1:-}" in
    hadolint) run_hadolint ;;
    dockle) shift; run_dockle "$@" ;;
    *)
        echo "Usage: $0 {hadolint|dockle [image-ref ...]}" >&2
        exit 2
        ;;
esac
