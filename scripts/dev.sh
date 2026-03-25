#!/bin/bash

# Development script for running all services
# Usage: bash scripts/dev.sh [tracing_backend]
#   tracing_backend: "otel" (OpenTelemetry, default) or "dd" (Datadog)

set -e

TRACING_BACKEND=${1:-otel}
SHARED_PACKAGES=(
  "@obs-playground/env"
  "@obs-playground/otel"
  "@obs-playground/graphql-client"
)

# Set up Datadog environment variable if using Datadog backend
if [ "$TRACING_BACKEND" = "dd" ]; then
  export DD_TRACE_ENABLED=true
  DD_PREFIX="DD_TRACE_ENABLED=true "
else
  DD_PREFIX=""
fi

# Build shared packages before starting app servers so their dist outputs exist.
for package in "${SHARED_PACKAGES[@]}"; do
  npm run build --workspace="$package"
done

# Run all services with both Next.js modes
NEXTJS_NORMAL_CMD="cd apps/nextjs-app && ${DD_PREFIX}PORT=3000 npm run dev"
NEXTJS_CUSTOM_CMD="cd apps/nextjs-app && ${DD_PREFIX}CUSTOM_SERVER=true PORT=3002 tsx --env-file=.env.local server.ts"

TANSTACK_CMD="cd apps/tanstack-start && ${DD_PREFIX}PORT=3100 npm run dev"

npx concurrently \
  --names "ENV,OTEL,GQL-CLIENT,NEXT,CUSTOM,EXPRESS,GRAPHQL,TANSTACK,PROXY" \
  --prefix-colors "white,blue,cyan,green,red,magenta,yellow,#ff6600,#00aa00" \
  "cd packages/env && npm run dev" \
  "cd packages/otel && npm run dev" \
  "cd packages/graphql-client && npm run dev" \
  "$NEXTJS_NORMAL_CMD" \
  "$NEXTJS_CUSTOM_CMD" \
  "cd apps/express-server && ${DD_PREFIX}PORT=3001 npm run dev" \
  "cd apps/graphql-server && ${DD_PREFIX}PORT=4000 npm run dev" \
  "$TANSTACK_CMD" \
  "tsx dev-proxy.ts"
