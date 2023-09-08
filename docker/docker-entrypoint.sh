#!/bin/sh
set -e

echo "loading"
# envsubst '${DB_URL},${}'< ormconfig.json > ormconfig.json
envsubst < config.json.template > customer-gadget/assets/config/config.json
envsubst < config.js.template > customer-gadget/assets/widget/config.js
echo "Printing config.json"
cat customer-gadget/assets/config/config.json
echo "=========================="
echo "Starting Customer Gadget"

exec nginx -g "daemon off;" "$@"

