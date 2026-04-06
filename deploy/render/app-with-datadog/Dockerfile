FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY . .

RUN npm ci --include=dev
RUN npm run build
RUN npm prune --omit=dev

FROM datadog/agent:7

WORKDIR /app

ENV DD_AUTOCONFIG_FROM_ENVIRONMENT=false
ENV DD_APM_ENABLED=true
ENV DD_APM_NON_LOCAL_TRAFFIC=true
ENV DD_DOGSTATSD_NON_LOCAL_TRAFFIC=true
ENV DD_PROCESS_AGENT_ENABLED=true
ENV DD_HOSTNAME=local-agent
ENV DD_OTLP_CONFIG_RECEIVER_PROTOCOLS_HTTP_ENDPOINT=0.0.0.0:4318
ENV DD_LOGS_ENABLED=true
ENV DD_OTLP_CONFIG_LOGS_ENABLED=true
ENV DATADOG_OTLP_ENDPOINT=http://127.0.0.1:4318
ENV HOST_PROC=/proc
ENV PATH=/app/node_modules/.bin:/opt/datadog-agent/bin/agent/:/opt/datadog-agent/embedded/bin/:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

COPY --from=builder /usr/local/bin/node /usr/local/bin/node
COPY --from=builder /app /app

RUN chmod +x \
  /app/deploy/render/app-with-datadog/start-service.sh \
  /app/deploy/render/app-with-datadog/run-app.sh

CMD ["./deploy/render/app-with-datadog/start-service.sh"]
