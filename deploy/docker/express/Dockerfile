FROM node:24-bookworm-slim AS pruner

WORKDIR /app

RUN npm install --global turbo@2.8.20

COPY . .
RUN turbo prune express-server --docker

FROM node:24-bookworm-slim AS builder

WORKDIR /app

# The pruned manifests and lockfile contain only the Express dependency graph.
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
COPY --from=pruner /app/patches ./patches
RUN npm ci

COPY --from=pruner /app/out/full/ ./
RUN npx turbo run build --filter=express-server \
    && npm prune --omit=dev --ignore-scripts

FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001 \
    SQLITE_PATH=/var/data/app.db

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/express-server/package.json ./apps/express-server/package.json
COPY --from=builder --chown=node:node /app/apps/express-server/dist ./apps/express-server/dist
COPY --from=builder --chown=node:node /app/apps/express-server/drizzle ./apps/express-server/drizzle
COPY --from=builder --chown=node:node /app/packages/env/package.json ./packages/env/package.json
COPY --from=builder --chown=node:node /app/packages/env/dist ./packages/env/dist
COPY --from=builder --chown=node:node /app/packages/graphql-client/package.json ./packages/graphql-client/package.json
COPY --from=builder --chown=node:node /app/packages/graphql-client/dist ./packages/graphql-client/dist
COPY --from=builder --chown=node:node /app/packages/otel/package.json ./packages/otel/package.json
COPY --from=builder --chown=node:node /app/packages/otel/dist ./packages/otel/dist
# npm keeps conflicting OpenTelemetry production versions local to this workspace.
COPY --from=builder --chown=node:node /app/packages/otel/node_modules ./packages/otel/node_modules

RUN mkdir -p /var/data && chown node:node /var/data

USER node

EXPOSE 3001

CMD ["node", "apps/express-server/dist/index.js"]
