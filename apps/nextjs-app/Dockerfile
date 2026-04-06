ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY patches ./patches
COPY apps/nextjs-app/package.json apps/nextjs-app/package.json
COPY packages/env/package.json packages/env/package.json
COPY packages/graphql-client/package.json packages/graphql-client/package.json
COPY packages/otel/package.json packages/otel/package.json
RUN npm ci

FROM deps AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SENTRY_DSN=""
ARG NEXT_PUBLIC_STATSIG_CLIENT_KEY=""
ARG NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=""
ARG NEXT_PUBLIC_DATADOG_APP_ID=""
COPY . .
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV NEXT_PUBLIC_STATSIG_CLIENT_KEY=${NEXT_PUBLIC_STATSIG_CLIENT_KEY}
ENV NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=${NEXT_PUBLIC_DATADOG_CLIENT_TOKEN}
ENV NEXT_PUBLIC_DATADOG_APP_ID=${NEXT_PUBLIC_DATADOG_APP_ID}
RUN npm run build --workspace=@obs-playground/env \
  && npm run build --workspace=@obs-playground/graphql-client \
  && npm run build --workspace=@obs-playground/otel \
  && npm run build --workspace=nextjs-app \
  && npm run build:custom --workspace=nextjs-app \
  && npm prune --omit=dev

FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/package-lock.json /app/turbo.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/nextjs-app ./apps/nextjs-app
COPY --from=builder /app/packages/env ./packages/env
COPY --from=builder /app/packages/graphql-client ./packages/graphql-client
COPY --from=builder /app/packages/otel ./packages/otel
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=nextjs-app"]
