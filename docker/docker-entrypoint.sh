#!/bin/sh
set -e

echo "loading"
# envsubst '${DB_URL},${}'< ormconfig.json > ormconfig.json
envsubst < config.json.template > /usr/share/nginx/html/assets/config.json

echo "Printing config.json"

cat /usr/share/nginx/html/assets/config.json

echo "=========================="
echo "Starting Customer widget"

exec nginx -g "daemon off;" "$@"

