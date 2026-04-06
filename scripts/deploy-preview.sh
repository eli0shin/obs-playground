#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)

required_vars=(
  PR_NUMBER
  BASE_DOMAIN
  IMAGE_TAG
  ACME_EMAIL
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

STACK_NAME="obs-pr-${PR_NUMBER}"
PREVIEW_ID="pr-${PR_NUMBER}"
STACK_ROUTER_PORT=$((20000 + (PR_NUMBER % 10000)))

export STACK_NAME
export PREVIEW_ID
export STACK_ROUTER_PORT
export STACK_ENV=preview
export STACK_VERSION="${IMAGE_TAG}"
export NEXT_HOST="pr-${PR_NUMBER}.preview.${BASE_DOMAIN}"
export CUSTOM_HOST="custom-pr-${PR_NUMBER}.preview.${BASE_DOMAIN}"
export TANSTACK_HOST="tanstack-pr-${PR_NUMBER}.preview.${BASE_DOMAIN}"

bash "$ROOT_DIR/scripts/deploy-stack.sh"
