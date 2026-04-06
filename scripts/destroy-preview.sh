#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
STACK_ROOT=${STACK_ROOT:-/srv/obs/stacks}
EDGE_ROUTES_DIR=${EDGE_ROUTES_DIR:-/srv/obs/edge/routes}

if [ -z "${PR_NUMBER:-}" ]; then
  printf 'Missing required environment variable: PR_NUMBER\n' >&2
  exit 1
fi

STACK_NAME="obs-pr-${PR_NUMBER}"
STACK_ENV_FILE="$STACK_ROOT/$STACK_NAME/stack.env"
EDGE_ROUTE_FILE="$EDGE_ROUTES_DIR/$STACK_NAME.caddy"

if [ -f "$STACK_ENV_FILE" ]; then
  docker compose \
    --env-file "$STACK_ENV_FILE" \
    -f "$ROOT_DIR/deploy/compose/stack.yaml" \
    -p "$STACK_NAME" \
    down --remove-orphans --volumes
fi

rm -f "$STACK_ENV_FILE" "$EDGE_ROUTE_FILE"
rm -rf "$STACK_ROOT/$STACK_NAME"

printf 'Destroyed preview stack %s\n' "$STACK_NAME"
