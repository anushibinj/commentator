# Stage 1: Build
FROM node:22.14.0-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Bake a sentinel value so the runtime entrypoint can substitute the real URL
ARG VITE_API_BASE_URL=__VITE_API_BASE_URL__
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Base path is always built as a sentinel so the published image is portable;
# the real value is injected at container startup by the entrypoint.
ARG VITE_BASE_PATH=__VITE_BASE_PATH__
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN npm run build

# Stage 2: Serve
FROM httpd:alpine

# Enable mod_rewrite, mod_deflate, mod_headers, mod_alias; allow .htaccess overrides;
# pre-create and include the runtime-generated base-path routing conf.
RUN sed -i \
    -e 's|^#\(LoadModule rewrite_module\)|\1|' \
    -e 's|^#\(LoadModule deflate_module\)|\1|' \
    -e 's|^#\(LoadModule headers_module\)|\1|' \
    -e 's|^#\(LoadModule alias_module\)|\1|' \
    -e 's|AllowOverride None|AllowOverride All|g' \
    /usr/local/apache2/conf/httpd.conf && \
    echo 'Include conf/extra/app-base.conf' >> /usr/local/apache2/conf/httpd.conf && \
    touch /usr/local/apache2/conf/extra/app-base.conf

# Files always land in the document root; entrypoint handles routing for sub-paths.
COPY --from=build /app/dist /usr/local/apache2/htdocs/
# .htaccess keeps the __VITE_BASE_PATH__ sentinel; entrypoint substitutes at startup.
COPY .htaccess /usr/local/apache2/htdocs/.htaccess

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Defaults — override at runtime via compose/docker run environment variables.
ENV VITE_API_BASE_URL=http://localhost:8080/api
ENV VITE_BASE_PATH=/

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["httpd-foreground"]
