#!/usr/bin/env bash
set -euo pipefail

image="obs-playground-tanstack-smoke-$$"
container="obs-playground-tanstack-smoke-$$"
container_port=4173

cleanup() {
  docker rm -f "$container" >/dev/null 2>&1 || true
  docker image rm "$image" >/dev/null 2>&1 || true
  if [[ -n ${page:-} ]]; then
    rm -f "$page"
  fi
}
trap cleanup EXIT

docker build \
  --platform linux/amd64 \
  --file deploy/docker/tanstack/Dockerfile \
  --tag "$image" \
  --build-arg DATADOG_APP_ID="smoke-test-app-id" \
  --build-arg DATADOG_CLIENT_TOKEN="smoke-test-client-token" \
  .

docker run --rm "$image" \
  grep --recursive --quiet "smoke-test-app-id" /app/apps/tanstack-start/.output/public

docker run --detach \
  --name "$container" \
  --env "PORT=${container_port}" \
  --publish "127.0.0.1::${container_port}" \
  "$image" >/dev/null

host_port=$(docker port "$container" "${container_port}/tcp" | awk -F: 'NR == 1 { print $NF }')

health_ready=false
for _ in {1..30}; do
  if curl --fail --max-time 2 --silent \
    "http://127.0.0.1:${host_port}/health" | grep --quiet '^OK$'; then
    health_ready=true
    break
  fi
  sleep 1
done

if [[ "$health_ready" != true ]]; then
  docker logs "$container"
  exit 1
fi

page_rendered=false
page=$(mktemp)
for _ in {1..12}; do
  if curl --fail --max-time 5 --silent \
    --output "$page" "http://127.0.0.1:${host_port}/batch-nutrition" \
    && grep --quiet 'Batch Nutrition Analysis' "$page"; then
    page_rendered=true
    break
  fi
  if [[ $(docker inspect --format '{{.State.Running}}' "$container") != true ]]; then
    break
  fi
  sleep 1
done

if [[ "$page_rendered" != true ]]; then
  docker logs "$container"
  exit 1
fi

echo "TanStack container smoke test passed"
