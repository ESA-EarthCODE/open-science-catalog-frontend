FROM node:lts-alpine AS build-step
ARG DYNAMIC_CONFIG=true
ARG SB_CONFIG=""
ENV DYNAMIC_CONFIG="${DYNAMIC_CONFIG}"
ENV SB_CONFIG="${SB_CONFIG}"

# git is needed to build the <stac-browser> web component from the upstream
# draft PR (radiantearth/stac-browser#778, branch `use-as-component`).
# TODO: Once @radiantearth/stac-browser v6.0.0 is published on npm, git is no longer needed here.
RUN apk add --no-cache git

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN [ "${DYNAMIC_CONFIG}" == "true" ] && sed -i 's/<!--RC//;s/RC-->//' index.html
RUN npm run build


FROM nginxinc/nginx-unprivileged:1-alpine
ARG pathPrefix="/"

USER root
RUN apk add --no-cache jq pcre-tools

COPY ./config.schema.json /etc/nginx/conf.d/config.schema.json
COPY --from=build-step /app/dist /usr/share/nginx/html
COPY --from=build-step /app/docker/default.conf /etc/nginx/conf.d/default.conf.template
ADD docker/docker-entrypoint.sh /docker-entrypoint.d/40-stac-browser-entrypoint.sh

# Remove default.conf so a skipped entrypoint fails loudly instead of serving nginx's welcome page.
RUN rm -f /etc/nginx/conf.d/default.conf && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod +x /docker-entrypoint.d/40-stac-browser-entrypoint.sh

ENV SB_pathPrefix="${pathPrefix}"

EXPOSE 8080

STOPSIGNAL SIGTERM

USER nginx
