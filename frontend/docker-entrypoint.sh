#!/bin/sh
set -e

# Replace the compile-time sentinel with the actual backend URL at container startup.
# This allows a single pre-built image to target different backends without rebuilding.
find /usr/local/apache2/htdocs/assets -name '*.js' -exec \
  sed -i "s|__VITE_API_BASE_URL__|${VITE_API_BASE_URL}|g" {} \;

exec "$@"
