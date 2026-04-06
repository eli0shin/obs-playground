#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
STACK_ROOT=${STACK_ROOT:-/srv/obs/stacks}
EDGE_ROUTES_DIR=${EDGE_ROUTES_DIR:-/srv/obs/edge/routes}

required_vars=(
  ACME_EMAIL
  STACK_NAME
  STACK_ENV
  STACK_VERSION
  STACK_ROUTER_PORT
  NEXT_HOST
  CUSTOM_HOST
  TANSTACK_HOST
  OBS_NEXTJS_IMAGE
  OBS_EXPRESS_IMAGE
  OBS_GRAPHQL_IMAGE
  OBS_TANSTACK_IMAGE
  DD_API_KEY
)

for var_name in "${required_vars[@]}"; do
  if [ -z "${!var_name:-}" ]; then
    printf 'Missing required environment variable: %s\n' "$var_name" >&2
    exit 1
  fi
done

mkdir -p "$STACK_ROOT/$STACK_NAME" "$EDGE_ROUTES_DIR"

STACK_ENV_FILE="$STACK_ROOT/$STACK_NAME/stack.env"
EDGE_ROUTE_FILE="$EDGE_ROUTES_DIR/$STACK_NAME.caddy"

escape_env_value() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

write_env_var() {
  local name="$1"
  local value="${!name:-}"

  if [ -n "$value" ]; then
    printf '%s="%s"\n' "$name" "$(escape_env_value "$value")" >> "$STACK_ENV_FILE"
  fi
}

: > "$STACK_ENV_FILE"

for env_name in \
  STACK_NAME \
  STACK_ENV \
  STACK_VERSION \
  STACK_ROUTER_PORT \
  NEXT_HOST \
  CUSTOM_HOST \
  TANSTACK_HOST \
  PREVIEW_ID \
  OBS_NEXTJS_IMAGE \
  OBS_EXPRESS_IMAGE \
  OBS_GRAPHQL_IMAGE \
  OBS_TANSTACK_IMAGE \
  ACME_EMAIL \
  DD_API_KEY \
  DD_SITE \
  DD_LOGS_ENABLED \
  DD_OTLP_CONFIG_LOGS_ENABLED \
  HONEYCOMB_ENDPOINT \
  HONEYCOMB_API_KEY \
  GRAFANA_OTLP_ENDPOINT \
  GRAFANA_OTLP_AUTH \
  SENTRY_OTLP_ENDPOINT \
  SENTRY_AUTH \
  SENTRY_AUTH_TOKEN \
  NEXT_PUBLIC_SENTRY_DSN \
  NEXT_PUBLIC_STATSIG_CLIENT_KEY \
  NEXT_PUBLIC_DATADOG_CLIENT_TOKEN \
  NEXT_PUBLIC_DATADOG_APP_ID \
  VITE_DATADOG_CLIENT_TOKEN \
  VITE_DATADOG_APP_ID; do
  write_env_var "$env_name"
done

cat > "$EDGE_ROUTE_FILE" <<EOF
${NEXT_HOST}, ${CUSTOM_HOST}, ${TANSTACK_HOST} {
  reverse_proxy 127.0.0.1:${STACK_ROUTER_PORT}
}
EOF

export STACK_ENV_FILE EDGE_ROUTES_DIR

docker compose \
  --env-file "$STACK_ENV_FILE" \
  -f "$ROOT_DIR/deploy/compose/edge.yaml" \
  up -d

docker compose \
  --env-file "$STACK_ENV_FILE" \
  -f "$ROOT_DIR/deploy/compose/stack.yaml" \
  -p "$STACK_NAME" \
  up -d

printf 'Deployed stack %s on router port %s\n' "$STACK_NAME" "$STACK_ROUTER_PORT"
