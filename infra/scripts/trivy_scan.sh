#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd -- "${script_dir}/../.." && pwd)"

if ! command -v docker >/dev/null 2>&1; then
    echo "docker could not be found." >&2
    exit 2
fi

action="${1:?action is required}"
trivy_image="${2:?Trivy image is required}"

case "$action" in
    config)
        docker run --rm -v "${repo_dir}:/workspace:ro" "$trivy_image" \
            --cache-dir /tmp/trivy-cache --quiet config --exit-code 1 --format table \
            --severity HIGH,CRITICAL /workspace
        ;;
    image)
        image_ref="${3:?image reference is required}"
        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock "$trivy_image" \
            --cache-dir /tmp/trivy-cache --quiet image --exit-code 1 --format table \
            --ignore-unfixed --image-src docker --pkg-types os,library --scanners vuln \
            --severity HIGH,CRITICAL "$image_ref"
        ;;
    *)
        echo "Usage: $0 {config TRIVY_IMAGE|image TRIVY_IMAGE IMAGE_REF}" >&2
        exit 2
        ;;
esac
