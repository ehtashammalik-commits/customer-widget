#!/bin/sh
set -e

echo "loading"
# envsubst '${DB_URL},${}'< ormconfig.json > ormconfig.json
envsubst < config.json.template > customer-widget/assets/config/config.json

echo "Printing config.json"

cat customer-widget/assets/config/config.json

echo "=========================="
echo "Starting Customer widget"

exec nginx -g "daemon off;" "$@"

