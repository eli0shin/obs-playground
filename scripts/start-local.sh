#!/bin/bash

# Local production-mode runner with portless routes.
# Builds the app/services, then serves them through portless using the same
# worktree-aware hostnames as dev.
# Usage: bash scripts/start-local.sh

set -e

export NODE_ENV=production
eval "$(node scripts/portless-env.mjs shell)"

npm run build

npx concurrently \
  --names "NEXT,CUSTOM,EXPRESS,GRAPHQL,TANSTACK" \
  --prefix-colors "cyan,red,magenta,yellow,#ff6600" \
  "npx portless run --name obs-playground npm run start --workspace=nextjs-app" \
  "CUSTOM_SERVER=true NODE_ENV=production npx portless run --name custom.obs-playground npm run start:custom --workspace=nextjs-app" \
  "npx portless run --name api.obs-playground bash -lc 'cd apps/express-server && node --env-file=../../.env --import ./dist/otel.js dist/index.js'" \
  "npx portless run --name graphql.obs-playground bash -lc 'cd apps/graphql-server && node --env-file=../../.env --import ./dist/otel.js dist/index.js'" \
  "npx portless run --name tanstack.obs-playground npm run start --workspace=tanstack-start"
