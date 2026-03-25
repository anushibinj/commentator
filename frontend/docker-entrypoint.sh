#!/bin/sh
set -e

HTDOCS="/usr/local/apache2/htdocs"

# ── Substitute runtime sentinels in all built assets ───────────────────────
# Both API URL and base path are replaced in one pass over JS/CSS/HTML files.
find "$HTDOCS" \( -name '*.js' -o -name '*.css' -o -name '*.html' \) \
  -exec sed -i \
    -e "s|__VITE_API_BASE_URL__|${VITE_API_BASE_URL}|g" \
    -e "s|__VITE_BASE_PATH__|${VITE_BASE_PATH}|g" \
  {} \;

# Also patch .htaccess (RewriteBase directive)
sed -i "s|__VITE_BASE_PATH__|${VITE_BASE_PATH}|g" "$HTDOCS/.htaccess"

# ── Generate Apache routing conf based on the base path ────────────────────
# For / (root): DocumentRoot already covers it; just lock down the directory.
# For sub-paths (/app/ etc.): create an Alias so requests to /app/assets/...
# are resolved from the document root regardless of subdirectory in the URL.
CONF="/usr/local/apache2/conf/extra/app-base.conf"
STRIPPED="${VITE_BASE_PATH%/}"  # /app/ → /app (Alias needs no trailing slash on URL side)

if [ "${VITE_BASE_PATH}" = "/" ]; then
    cat > "$CONF" <<EOF
<Directory "$HTDOCS">
    Options -Indexes -MultiViews
    AllowOverride All
    Require all granted
</Directory>
EOF
else
    cat > "$CONF" <<EOF
# Map both /app and /app/ to the document root so assets resolve correctly.
Alias ${STRIPPED} ${HTDOCS}/
Alias ${STRIPPED}/ ${HTDOCS}/
<Directory "$HTDOCS">
    Options -Indexes -MultiViews
    AllowOverride All
    Require all granted
</Directory>
EOF
fi

exec "$@"
