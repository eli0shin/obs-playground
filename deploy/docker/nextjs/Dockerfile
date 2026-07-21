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

ENV NEXT_PUBLIC_DATADOG_APP_ID=$DATADOG_APP_ID \
    NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=$DATADOG_CLIENT_TOKEN \
    NEXT_PUBLIC_GRAPHQL_BASE_URL=$NEXT_PUBLIC_GRAPHQL_BASE_URL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_STATSIG_CLIENT_KEY=$NEXT_PUBLIC_STATSIG_CLIENT_KEY

RUN npm run build:packages && npm run build --workspace nextjs-app

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

WORKDIR /app

COPY --chown=node:node --from=builder /app/apps/nextjs-app/.next/standalone ./
COPY --chown=node:node --from=builder /app/apps/nextjs-app/.next/static ./apps/nextjs-app/.next/static
COPY --chown=node:node --from=builder /app/apps/nextjs-app/public ./apps/nextjs-app/public

WORKDIR /app/apps/nextjs-app

USER node

EXPOSE 3000

CMD ["node", "server.js"]
