#!/usr/bin/env bash
set -euo pipefail

IMAGE="${GRAPHQL_SMOKE_IMAGE:-obs-playground-graphql:smoke}"
CONTAINER="obs-playground-graphql-smoke-$$"
PORT="${GRAPHQL_SMOKE_PORT:-14000}"
CONTAINER_PORT=4100

cleanup() {
  status=$?
  if (( status != 0 )); then
    docker logs "${CONTAINER}" 2>/dev/null || true
  fi
  docker rm --force "${CONTAINER}" >/dev/null 2>&1 || true
  return "${status}"
}
trap cleanup EXIT

docker build \
  --platform linux/amd64 \
  --file deploy/docker/graphql/Dockerfile \
  --tag "${IMAGE}" \
  .

docker run \
  --detach \
  --name "${CONTAINER}" \
  --publish "127.0.0.1:${PORT}:${CONTAINER_PORT}" \
  --env PORT="${CONTAINER_PORT}" \
  "${IMAGE}" >/dev/null

for _ in {1..30}; do
  if curl --fail --silent "http://127.0.0.1:${PORT}/health" | grep --quiet '"status":"healthy"'; then
    break
  fi
  sleep 1
done

curl --fail --silent "http://127.0.0.1:${PORT}/health" | grep --quiet '"status":"healthy"'
curl --fail --silent \
  --header 'content-type: application/json' \
  --data '{"query":"{ __typename }"}' \
  "http://127.0.0.1:${PORT}/graphql" | grep --quiet '"__typename":"Query"'

printf 'GraphQL container smoke test passed on port %s.\n' "${PORT}"
