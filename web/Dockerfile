# Build stage: install, type-check, bundle.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
# The committed Yarn release runs directly: no Corepack download inside the build.
RUN node .yarn/releases/yarn-4.18.1.cjs install --immutable
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts pwa-assets.config.ts index.html ./
COPY public ./public
COPY src ./src
# Vite reads VITE_* from the environment as well as from .env files. The real API sits behind Caddy on /api, and
# the build ships without mocks (so the PWA service worker is on).
ENV VITE_PROJECT_PATH=/ \
  VITE_BASE_API_URL=/api \
  VITE_USE_MOCKS=false
RUN node .yarn/releases/yarn-4.18.1.cjs build

# Runtime stage: Caddy serves dist/ over HTTPS and proxies /api to the api container.
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 8443
