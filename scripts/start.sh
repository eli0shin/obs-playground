#!/bin/bash

# Production start script for running all services
# Usage: bash scripts/start.sh

set -e

eval "$(node scripts/portless-env.mjs shell)"

# Start all services in production mode
npx concurrently \
  --names "NEXT,CUSTOM,EXPRESS,GRAPHQL,TANSTACK" \
  --prefix-colors "cyan,red,magenta,yellow,#ff6600" \
  "npx portless run --name obs-playground npm run start --workspace=nextjs-app" \
  "CUSTOM_SERVER=true NODE_ENV=production npx portless run --name custom.obs-playground npm run start:custom --workspace=nextjs-app" \
  "npx portless run --name api.obs-playground bash -lc 'cd apps/express-server && node --env-file=../../.env dist/index.js'" \
  "npx portless run --name graphql.obs-playground bash -lc 'cd apps/graphql-server && node --env-file=../../.env dist/index.js'" \
  "npx portless run --name tanstack.obs-playground npm run start --workspace=tanstack-start"
