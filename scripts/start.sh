#!/bin/bash

# Production start script for running all services
# Usage: bash scripts/start.sh

set -e

# Start all services in production mode
npx concurrently \
  --names "NEXT,CUSTOM,EXPRESS,GRAPHQL,TANSTACK,PROXY" \
  --prefix-colors "cyan,red,magenta,yellow,#ff6600,green" \
  "cd apps/nextjs-app && PORT=3000 npm run start" \
  "cd apps/nextjs-app && CUSTOM_SERVER=true NODE_ENV=production PORT=3002 tsx server.ts" \
  "cd apps/express-server && PORT=3001 node --env-file=../../.env dist/index.js" \
  "cd apps/graphql-server && PORT=4000 node --env-file=../../.env dist/index.js" \
  "cd apps/tanstack-start && PORT=3100 npm run start" \
  "tsx dev-proxy.ts"
