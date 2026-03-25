# Stage 1: Build
FROM node:22.14.0-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Bake a sentinel value so the runtime entrypoint can substitute the real URL
ARG VITE_API_BASE_URL=__VITE_API_BASE_URL__
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Stage 2: Serve
FROM httpd:alpine
COPY --from=build /app/dist /usr/local/apache2/htdocs/
# Enable mod_rewrite and AllowOverride for SPA routing
RUN sed -i \
    -e 's|^#\(LoadModule rewrite_module\)|\1|' \
    -e 's|AllowOverride None|AllowOverride All|g' \
    /usr/local/apache2/conf/httpd.conf
COPY .htaccess /usr/local/apache2/htdocs/.htaccess
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Default value used when no env var is supplied at runtime
ENV VITE_API_BASE_URL=http://localhost:8080/api

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["httpd-foreground"]
