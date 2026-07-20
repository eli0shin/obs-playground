FROM node:24-bookworm-slim AS pruner

WORKDIR /app

RUN npm install --global turbo@2.8.20

COPY . .
RUN turbo prune graphql-server --docker

FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
COPY --from=pruner /app/patches ./patches
RUN npm ci

COPY --from=pruner /app/out/full/ ./
RUN npx turbo run build --filter=graphql-server
RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/apps/graphql-server/package.json ./apps/graphql-server/package.json
COPY --from=builder --chown=node:node /app/apps/graphql-server/dist ./apps/graphql-server/dist
COPY --from=builder --chown=node:node /app/packages/env/package.json ./packages/env/package.json
COPY --from=builder --chown=node:node /app/packages/env/dist ./packages/env/dist
COPY --from=builder --chown=node:node /app/packages/otel/package.json ./packages/otel/package.json
COPY --from=builder --chown=node:node /app/packages/otel/dist ./packages/otel/dist
# npm keeps conflicting OpenTelemetry production versions local to this workspace.
COPY --from=builder --chown=node:node /app/packages/otel/node_modules ./packages/otel/node_modules

USER node
EXPOSE 4000

CMD ["node", "--import", "./apps/graphql-server/dist/otel.js", "apps/graphql-server/dist/index.js"]
