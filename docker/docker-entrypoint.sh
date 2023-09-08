#!/bin/sh
set -e

echo "loading"
#envsubst '${DB_URL},${}'< ormconfig.json > ormconfig.json
envsubst < config.json.template > /usr/share/nginx/html/assets/config/config.json
envsubst < config.js.template > assets/widget/config.js
echo "Printing config.json"
cat assets/config/config.json
echo "=========================="
echo "Starting Customer Gadget"

exec nginx -g "daemon off;" "$@"

