FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY patches ./patches
COPY apps/express-server/package.json ./apps/express-server/package.json
COPY apps/graphql-server/package.json ./apps/graphql-server/package.json
COPY apps/nextjs-app/package.json ./apps/nextjs-app/package.json
COPY apps/tanstack-start/package.json ./apps/tanstack-start/package.json
COPY packages/env/package.json ./packages/env/package.json
COPY packages/graphql-client/package.json ./packages/graphql-client/package.json
COPY packages/otel/package.json ./packages/otel/package.json
COPY packages/playwright-tests/package.json ./packages/playwright-tests/package.json

RUN npm ci --include=dev

COPY . .

RUN npm run build
RUN npm prune --omit=dev

FROM datadog/agent:7

WORKDIR /app

ENV DD_AUTOCONFIG_FROM_ENVIRONMENT=false
ENV DD_APM_ENABLED=true
ENV DD_APM_NON_LOCAL_TRAFFIC=true
ENV DD_DOGSTATSD_NON_LOCAL_TRAFFIC=true
ENV DD_PROCESS_AGENT_ENABLED=true
ENV DD_OTLP_CONFIG_RECEIVER_PROTOCOLS_HTTP_ENDPOINT=0.0.0.0:4318
ENV DD_LOGS_ENABLED=true
ENV DD_OTLP_CONFIG_LOGS_ENABLED=true
ENV DATADOG_OTLP_ENDPOINT=http://127.0.0.1:4318
ENV HOST_PROC=/proc
ENV PATH=/app/node_modules/.bin:/opt/datadog-agent/bin/agent/:/opt/datadog-agent/embedded/bin/:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

COPY --from=builder /usr/local/ /usr/local/
COPY --from=builder /app /app

RUN chmod +x \
  /app/deploy/render/app-with-datadog/start-service.sh \
  /app/deploy/render/app-with-datadog/run-app.sh

CMD ["./deploy/render/app-with-datadog/start-service.sh"]
