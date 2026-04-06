#!/usr/bin/env bash

set -euo pipefail

if [ -z "${STACK_NAME:-}" ]; then
  printf 'Missing required environment variable: STACK_NAME\n' >&2
  exit 1
fi

BACKUP_ROOT=${BACKUP_ROOT:-/srv/obs/backups}
TIMESTAMP=${TIMESTAMP:-$(date +%Y%m%d%H%M%S)}
DESTINATION_DIR="$BACKUP_ROOT/$STACK_NAME/$TIMESTAMP"

mkdir -p "$DESTINATION_DIR"

backup_volume() {
  local volume_name="$1"
  local archive_name="$2"

  docker run --rm \
    -v "${volume_name}:/source:ro" \
    -v "${DESTINATION_DIR}:/backup" \
    alpine:3.22 \
    tar czf "/backup/${archive_name}" -C /source .
}

backup_volume "${STACK_NAME}_express-data" "express-data.tgz"
backup_volume "${STACK_NAME}_graphql-data" "graphql-data.tgz"

printf 'Backed up SQLite volumes for %s to %s\n' "$STACK_NAME" "$DESTINATION_DIR"
