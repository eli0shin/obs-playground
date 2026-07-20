FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY patches ./patches
COPY apps ./apps
COPY packages ./packages

RUN npm ci

ARG DATADOG_APP_ID
ARG DATADOG_CLIENT_TOKEN
ARG NEXT_PUBLIC_GRAPHQL_BASE_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_STATSIG_CLIENT_KEY

ENV CUSTOM_SERVER=true \
    NEXT_PUBLIC_DATADOG_APP_ID=$DATADOG_APP_ID \
    NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=$DATADOG_CLIENT_TOKEN \
    NEXT_PUBLIC_GRAPHQL_BASE_URL=$NEXT_PUBLIC_GRAPHQL_BASE_URL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_STATSIG_CLIENT_KEY=$NEXT_PUBLIC_STATSIG_CLIENT_KEY

RUN npm run build:packages && npm run build:custom --workspace nextjs-app

FROM node:24-bookworm-slim AS production-dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/nextjs-app/package.json ./apps/nextjs-app/package.json
COPY packages/env/package.json ./packages/env/package.json
COPY packages/graphql-client/package.json ./packages/graphql-client/package.json
COPY packages/otel/package.json ./packages/otel/package.json
COPY packages/trpc-otel/package.json ./packages/trpc-otel/package.json

RUN npm ci --omit=dev --ignore-scripts \
    --workspace=nextjs-app --include-workspace-root=false

FROM node:24-bookworm-slim AS runtime

ENV CUSTOM_SERVER=true \
    NODE_ENV=production \
    PORT=3000

WORKDIR /app

COPY --chown=node:node --from=builder /app/apps/nextjs-app/.next-custom/standalone ./
COPY --chown=node:node --from=builder /app/apps/nextjs-app/.next-custom/static ./apps/nextjs-app/.next-custom/static
COPY --chown=node:node --from=builder /app/apps/nextjs-app/public ./apps/nextjs-app/public
COPY --chown=node:node --from=builder /app/apps/nextjs-app/next.config.ts ./apps/nextjs-app/next.config.ts
COPY --chown=node:node --from=builder /app/apps/nextjs-app/server.ts ./apps/nextjs-app/server.ts
COPY --chown=node:node --from=builder /app/apps/nextjs-app/src/otel.ts ./apps/nextjs-app/src/otel.ts
COPY --chown=node:node --from=builder /app/apps/nextjs-app/src/logger.ts ./apps/nextjs-app/src/logger.ts
COPY --chown=node:node --from=production-dependencies /app/node_modules ./node_modules
# The production install skips postinstall; keep these copies in sync with runtime dependencies in patches/.
COPY --chown=node:node --from=builder /app/node_modules/@opentelemetry/instrumentation-graphql ./node_modules/@opentelemetry/instrumentation-graphql
COPY --chown=node:node --from=builder /app/node_modules/@opentelemetry/instrumentation-http ./node_modules/@opentelemetry/instrumentation-http
COPY --chown=node:node --from=builder /app/packages/env/package.json ./packages/env/package.json
COPY --chown=node:node --from=builder /app/packages/env/dist ./packages/env/dist
COPY --chown=node:node --from=builder /app/packages/graphql-client/package.json ./packages/graphql-client/package.json
COPY --chown=node:node --from=builder /app/packages/graphql-client/dist ./packages/graphql-client/dist
COPY --chown=node:node --from=builder /app/packages/otel/package.json ./packages/otel/package.json
COPY --chown=node:node --from=builder /app/packages/otel/dist ./packages/otel/dist
COPY --chown=node:node --from=production-dependencies /app/packages/otel/node_modules ./packages/otel/node_modules
COPY --chown=node:node --from=builder /app/packages/trpc-otel/package.json ./packages/trpc-otel/package.json
COPY --chown=node:node --from=builder /app/packages/trpc-otel/dist ./packages/trpc-otel/dist

WORKDIR /app/apps/nextjs-app

USER node

EXPOSE 3000

CMD ["node", "--import", "tsx", "server.ts"]
