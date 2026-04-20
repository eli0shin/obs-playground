#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${APP_START_COMMAND:-}" ]]; then
  echo "APP_START_COMMAND must be set"
  exit 1
fi

if [[ -z "${APP_WORKDIR:-}" ]]; then
  echo "APP_WORKDIR must be set"
  exit 1
fi

cd "/app/${APP_WORKDIR}"
exec /bin/bash -c "$APP_START_COMMAND"
