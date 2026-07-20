FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY patches ./patches
COPY apps/tanstack-start/package.json ./apps/tanstack-start/package.json
COPY packages/env/package.json ./packages/env/package.json
COPY packages/graphql-client/package.json ./packages/graphql-client/package.json
COPY packages/otel/package.json ./packages/otel/package.json

RUN npm ci --workspace=tanstack-start --include-workspace-root --include=dev

COPY apps/tanstack-start ./apps/tanstack-start
COPY packages/env ./packages/env
COPY packages/graphql-client ./packages/graphql-client
COPY packages/otel ./packages/otel

ARG DATADOG_APP_ID
ARG DATADOG_CLIENT_TOKEN
ARG VITE_GRAPHQL_BASE_URL

ENV VITE_DATADOG_APP_ID=$DATADOG_APP_ID \
    VITE_DATADOG_CLIENT_TOKEN=$DATADOG_CLIENT_TOKEN \
    VITE_GRAPHQL_BASE_URL=$VITE_GRAPHQL_BASE_URL

RUN npm run build --workspace=@obs-playground/env \
    && npm run build --workspace=@obs-playground/graphql-client \
    && npm run build --workspace=@obs-playground/otel \
    && npm run build --workspace=tanstack-start

FROM node:24-bookworm-slim AS production-dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/env/package.json ./packages/env/package.json
COPY packages/graphql-client/package.json ./packages/graphql-client/package.json
COPY packages/otel/package.json ./packages/otel/package.json

RUN npm ci --omit=dev --ignore-scripts \
      --workspace=@obs-playground/env \
      --workspace=@obs-playground/graphql-client \
      --workspace=@obs-playground/otel \
      --include-workspace-root=false \
    && test ! -e node_modules/@tanstack/react-start

COPY --from=builder /app/node_modules/@opentelemetry/instrumentation-graphql ./node_modules/@opentelemetry/instrumentation-graphql
COPY --from=builder /app/node_modules/@opentelemetry/instrumentation-http ./node_modules/@opentelemetry/instrumentation-http

FROM node:24-bookworm-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/packages/env/package.json ./packages/env/package.json
COPY --from=builder /app/packages/env/dist ./packages/env/dist
COPY --from=builder /app/packages/graphql-client/package.json ./packages/graphql-client/package.json
COPY --from=builder /app/packages/graphql-client/dist ./packages/graphql-client/dist
COPY --from=builder /app/packages/otel/package.json ./packages/otel/package.json
COPY --from=builder /app/packages/otel/dist ./packages/otel/dist
COPY --from=production-dependencies /app/packages/otel/node_modules ./packages/otel/node_modules
COPY --from=builder /app/apps/tanstack-start/.output ./apps/tanstack-start/.output

USER node
EXPOSE 3000

CMD ["node", "/app/apps/tanstack-start/.output/server/index.mjs"]
