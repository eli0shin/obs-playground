#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${APP_START_COMMAND:-}" ]]; then
  echo "APP_START_COMMAND must be set"
  exit 1
fi

cd /app
exec /bin/bash -lc "$APP_START_COMMAND"
