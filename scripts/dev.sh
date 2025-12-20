#!/bin/bash

# Development script for running all services with optional configurations
# Usage: bash scripts/dev.sh <nextjs_mode> <tracing_backend>
#   nextjs_mode: "next" (built-in) or "custom" (custom server)
#   tracing_backend: "otel" (OpenTelemetry) or "dd" (Datadog)

set -e

NEXTJS_MODE=${1:-next}
TRACING_BACKEND=${2:-otel}

# Map argument to npm script and console label
if [ "$NEXTJS_MODE" = "custom" ]; then
  NEXTJS_SCRIPT="dev:custom"
  NEXTJS_LABEL="CUSTOM"
else
  NEXTJS_SCRIPT="dev"
  NEXTJS_LABEL="NEXT"
fi

# Set up Datadog environment variable if using Datadog backend
if [ "$TRACING_BACKEND" = "dd" ]; then
  export DD_TRACE_ENABLED=true
  DD_PREFIX="DD_TRACE_ENABLED=true "
else
  DD_PREFIX=""
fi

# Run all services with concurrently
npx concurrently \
  --names "OTEL,GQL-CLIENT,$NEXTJS_LABEL,EXPRESS,GRAPHQL,PROXY" \
  --prefix-colors "blue,white,cyan,magenta,yellow,green" \
  "cd packages/otel && npm run dev" \
  "cd packages/graphql-client && npm run dev" \
  "cd apps/nextjs-app && ${DD_PREFIX}PORT=3000 npm run $NEXTJS_SCRIPT" \
  "cd apps/express-server && ${DD_PREFIX}PORT=3001 npm run dev" \
  "cd apps/graphql-server && ${DD_PREFIX}PORT=4000 npm run dev" \
  "tsx dev-proxy.ts"
