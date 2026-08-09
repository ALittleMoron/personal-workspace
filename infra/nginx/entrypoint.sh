#!/usr/bin/env sh
set -eu

readonly template_file=/etc/nginx/runtime-templates/site.conf.template
readonly rendered_directory=/tmp/nginx-conf.d
readonly rendered_file="${rendered_directory}/site.conf"
readonly temporary_file="${rendered_file}.tmp"

mkdir -p "$rendered_directory"
envsubst '$APP_DOMAIN $SSL_CERT $SSL_KEY $ACTIVE_BACKEND_SLOT $ACTIVE_FRONTEND_SLOT' \
    < "$template_file" > "$temporary_file"

if [ ! -s "$temporary_file" ]; then
    echo "Rendered nginx configuration is empty." >&2
    exit 1
fi

mv "$temporary_file" "$rendered_file"
if [ "${NGINX_VALIDATE_ONLY:-0}" = "1" ]; then
    exec nginx -t
fi
exec nginx -g "daemon off;"
