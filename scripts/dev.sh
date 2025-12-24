#!/bin/bash

# Development script for running all services
# Usage: bash scripts/dev.sh [tracing_backend]
#   tracing_backend: "otel" (OpenTelemetry, default) or "dd" (Datadog)

set -e

TRACING_BACKEND=${1:-otel}

# Set up Datadog environment variable if using Datadog backend
if [ "$TRACING_BACKEND" = "dd" ]; then
  export DD_TRACE_ENABLED=true
  DD_PREFIX="DD_TRACE_ENABLED=true "
else
  DD_PREFIX=""
fi

# Run all services with both Next.js modes
NEXTJS_NORMAL_CMD="cd apps/nextjs-app && ${DD_PREFIX}PORT=3000 npm run dev"
NEXTJS_CUSTOM_CMD="${DD_PREFIX}CUSTOM_SERVER=true PORT=3002 tsx --env-file=apps/nextjs-app/.env.local apps/nextjs-app/server.ts"

npx concurrently \
  --names "OTEL,GQL-CLIENT,NEXT,CUSTOM,EXPRESS,GRAPHQL,PROXY" \
  --prefix-colors "blue,white,cyan,red,magenta,yellow,green" \
  "cd packages/otel && npm run dev" \
  "cd packages/graphql-client && npm run dev" \
  "$NEXTJS_NORMAL_CMD" \
  "$NEXTJS_CUSTOM_CMD" \
  "cd apps/express-server && ${DD_PREFIX}PORT=3001 npm run dev" \
  "cd apps/graphql-server && ${DD_PREFIX}PORT=4000 npm run dev" \
  "tsx dev-proxy.ts"
