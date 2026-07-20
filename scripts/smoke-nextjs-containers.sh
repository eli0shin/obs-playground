#!/usr/bin/env bash
set -euo pipefail

standard_image="obs-playground-nextjs:smoke"
custom_image="obs-playground-nextjs-custom:smoke"
standard_container="obs-playground-nextjs-smoke"
custom_container="obs-playground-nextjs-custom-smoke"

cleanup() {
  docker rm -f "$standard_container" "$custom_container" >/dev/null 2>&1 || true
}
trap cleanup EXIT

wait_for_page() {
  local url=$1
  for _ in {1..120}; do
    if curl --fail --silent --show-error "$url" >/dev/null 2>&1; then
      return
    fi
    sleep 1
  done

  echo "Timed out waiting for $url" >&2
  return 1
}

docker build --platform linux/amd64 \
  --file deploy/docker/nextjs/Dockerfile \
  --tag "$standard_image" .
docker build --platform linux/amd64 \
  --file deploy/docker/nextjs-custom/Dockerfile \
  --tag "$custom_image" .

test "$(docker image inspect --format '{{json .Config.Cmd}}' "$standard_image")" = \
  '["node","server.js"]'
test "$(docker image inspect --format '{{json .Config.Cmd}}' "$custom_image")" = \
  '["node","--import","tsx","server.ts"]'

docker run --rm "$standard_image" sh -c \
  'test -f .next/BUILD_ID && test ! -e .next-custom && test ! -e server.ts'
docker run --rm "$custom_image" sh -c \
  'test -f .next-custom/BUILD_ID && test ! -e .next && test -f server.ts && node --import tsx --eval ""'

for image in "$standard_image" "$custom_image"; do
  docker run --rm "$image" sh -c \
    'grep --quiet "Only set status if it.*ERROR" /app/node_modules/@opentelemetry/instrumentation-http/build/src/http.js && grep --quiet OPERATION_SPAN_KEY /app/node_modules/@opentelemetry/instrumentation-graphql/build/src/instrumentation.js'
done

docker run --detach --name "$standard_container" --publish 3100:3000 \
  "$standard_image" >/dev/null
docker run --detach --name "$custom_container" --publish 3101:3000 \
  "$custom_image" >/dev/null

wait_for_page http://127.0.0.1:3100/health
wait_for_page http://127.0.0.1:3101/health
curl --fail --silent http://127.0.0.1:3100/health | grep --quiet '"status":"healthy"'
curl --fail --silent http://127.0.0.1:3101/health | grep --quiet '"status":"healthy"'
curl --fail --silent http://127.0.0.1:3100/ | grep --quiet 'Recipe &amp; Meal Planning'
curl --fail --silent http://127.0.0.1:3101/ | grep --quiet 'Recipe &amp; Meal Planning'
