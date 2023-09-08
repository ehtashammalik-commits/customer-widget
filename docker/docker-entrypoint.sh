#!/bin/sh
set -e

echo "loading"
# envsubst '${DB_URL},${}'< ormconfig.json > ormconfig.json
envsubst < config.json.template > dist/assets/config/config.json
envsubst < config.js.template > dist/assets/widget/config.js
echo "Printing config.json"
cat dist/assets/config/config.json
echo "=========================="
echo "Starting Customer Gadget"

exec nginx -g "daemon off;" "$@"

