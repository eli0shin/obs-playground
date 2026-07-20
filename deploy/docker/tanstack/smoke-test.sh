#!/usr/bin/env bash
set -euo pipefail

image="obs-playground-tanstack-smoke-$$"
container="obs-playground-tanstack-smoke-$$"
mock_container="obs-playground-tanstack-graphql-mock-$$"
network="obs-playground-tanstack-smoke-$$"
container_port=4173

cleanup() {
  docker rm -f "$container" "$mock_container" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
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
docker run --rm "$image" \
  grep --recursive --quiet "smoke-test-client-token" /app/apps/tanstack-start/.output/public

docker network create "$network" >/dev/null
docker run --detach \
  --name "$mock_container" \
  --network "$network" \
  node:24-bookworm-slim \
  node --eval '
    const http = require("node:http");
    http.createServer((request, response) => {
      request.resume();
      request.on("end", () => {
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ data: { recipes: [], categories: [] } }));
      });
    }).listen(4000, "0.0.0.0");
  ' >/dev/null

mock_ready=false
for _ in {1..60}; do
  if docker exec "$mock_container" node --eval \
    'fetch("http://127.0.0.1:4000/graphql").then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))'; then
    mock_ready=true
    break
  fi
  if [[ $(docker inspect --format '{{.State.Running}}' "$mock_container") != true ]]; then
    break
  fi
  sleep 1
done

if [[ "$mock_ready" != true ]]; then
  docker logs "$mock_container"
  exit 1
fi

docker run --detach \
  --name "$container" \
  --network "$network" \
  --env "PORT=${container_port}" \
  --env "GRAPHQL_BASE_URL=http://${mock_container}:4000" \
  --publish "127.0.0.1::${container_port}" \
  "$image" >/dev/null

host_port=$(docker port "$container" "${container_port}/tcp" | awk -F: 'NR == 1 { print $NF }')

health_ready=false
for _ in {1..120}; do
  if curl --fail --max-time 2 --silent \
    "http://127.0.0.1:${host_port}/health" | grep --quiet '^OK$'; then
    health_ready=true
    break
  fi
  if [[ $(docker inspect --format '{{.State.Running}}' "$container") != true ]]; then
    break
  fi
  sleep 1
done

if [[ "$health_ready" != true ]]; then
  docker logs "$container"
  exit 1
fi

assert_rendered_page() {
  local path=$1
  local expected_text=$2
  page=$(mktemp)

  if ! curl --fail --max-time 120 --silent --show-error \
    --output "$page" "http://127.0.0.1:${host_port}${path}" \
    || ! grep --quiet "$expected_text" "$page"; then
    docker logs "$container"
    return 1
  fi

  rm -f "$page"
  page=""
}

# The root loader exercises a real server-side GraphQL request against the mock.
assert_rendered_page "/" "Recipe &amp; Meal Planning"
assert_rendered_page "/batch-nutrition" "Batch Nutrition Analysis"

echo "TanStack container smoke test passed"
