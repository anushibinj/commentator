# Stage 1: Build
FROM node:22.14.0-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Bake a sentinel value so the runtime entrypoint can substitute the real URL
ARG VITE_API_BASE_URL=__VITE_API_BASE_URL__
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Base (context) path for the app, baked in at build time
ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN npm run build

# Stage 2: Serve
FROM httpd:alpine
# Redeclare so it is available for COPY destination expansion and RUN substitution
ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

# Enable mod_rewrite, mod_deflate, mod_headers; allow .htaccess overrides
RUN sed -i \
    -e 's|^#\(LoadModule rewrite_module\)|\1|' \
    -e 's|^#\(LoadModule deflate_module\)|\1|' \
    -e 's|^#\(LoadModule headers_module\)|\1|' \
    -e 's|AllowOverride None|AllowOverride All|g' \
    /usr/local/apache2/conf/httpd.conf

COPY --from=build /app/dist /usr/local/apache2/htdocs${VITE_BASE_PATH}
# Template .htaccess: substitute base-path placeholder baked at build time
COPY .htaccess /tmp/.htaccess.tpl
RUN sed "s|__VITE_BASE_PATH__|${VITE_BASE_PATH}|g" /tmp/.htaccess.tpl \
    > "/usr/local/apache2/htdocs${VITE_BASE_PATH}/.htaccess"

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Default value used when no env var is supplied at runtime
ENV VITE_API_BASE_URL=http://localhost:8080/api

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["httpd-foreground"]
