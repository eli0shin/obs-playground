#!/bin/bash

# Development script for running all services
# Usage: bash scripts/dev.sh [backend]
#   backend: "otel" (default) - OTEL traces + OTEL logs
#            "dd" - dd-trace traces + dd-trace logs
#            "dd-logs" - OTEL traces + dd-trace log injection (pino → stdout)

set -e

export NODE_ENV=development
eval "$(node scripts/portless-env.mjs shell)"

TRACING_BACKEND=${1:-otel}
SHARED_PACKAGES=(
  "@obs-playground/env"
  "@obs-playground/otel"
  "@obs-playground/graphql-client"
)

export DD_LOGS_ENABLED=true
DD_PREFIX="DD_LOGS_ENABLED=true "

# Set up environment variables based on backend choice
if [ "$TRACING_BACKEND" = "dd" ]; then
  export DD_TRACE_ENABLED=true
  DD_PREFIX="DD_TRACE_ENABLED=true DD_LOGS_ENABLED=true "
fi

# Build shared packages before starting app servers so their dist outputs exist.
for package in "${SHARED_PACKAGES[@]}"; do
  npm run build --workspace="$package"
done

npx concurrently \
  --names "ENV,OTEL,GQL-CLIENT,NEXT,CUSTOM,EXPRESS,GRAPHQL,TANSTACK" \
  --prefix-colors "white,blue,cyan,green,red,magenta,yellow,#ff6600" \
  "cd packages/env && npm run dev" \
  "cd packages/otel && npm run dev" \
  "cd packages/graphql-client && npm run dev" \
  "${DD_PREFIX}npx portless run --name obs-playground npm run dev --workspace=nextjs-app" \
  "${DD_PREFIX}CUSTOM_SERVER=true npx portless run --name custom.obs-playground npm run dev:custom --workspace=nextjs-app" \
  "${DD_PREFIX}npx portless run --name api.obs-playground npm run dev --workspace=express-server" \
  "${DD_PREFIX}npx portless run --name graphql.obs-playground npm run dev --workspace=graphql-server" \
  "${DD_PREFIX}npx portless run --name tanstack.obs-playground npm run dev --workspace=tanstack-start"
