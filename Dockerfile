# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

# Keep the dependency layer small on constrained VPS hosts. The image layer is
# cached by Docker itself, so retaining a second npm tarball cache only consumes
# additional disk space during builds.
RUN npm ci --no-audit --no-fund --prefer-online \
    && npm cache clean --force

FROM dependencies AS builder

COPY . .

RUN npm run build:docker

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001

WORKDIR /app

COPY --from=builder --chown=node:node /app/dist/standalone ./

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || '3001') + '/').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "server.js"]
