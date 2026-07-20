#!/usr/bin/env bash
set -euo pipefail

container_engine=${CONTAINER_ENGINE:-docker}
image=${EXPRESS_SMOKE_IMAGE:-obs-playground-express:smoke}
requested_host_port=${EXPRESS_SMOKE_PORT:-}
host_port=""
run_id="${$}-$(date +%s)"
volume="obs-playground-express-smoke-${run_id}"
first_container="obs-playground-express-smoke-first-${run_id}"
second_container="obs-playground-express-smoke-second-${run_id}"
recipe_title="container-smoke-${run_id}"

cleanup() {
  "$container_engine" rm -f "$first_container" "$second_container" >/dev/null 2>&1 || true
  "$container_engine" volume rm "$volume" >/dev/null 2>&1 || true
}
trap cleanup EXIT

wait_for_health() {
  local container=$1
  local health_url="http://127.0.0.1:${host_port}/health"

  for _ in $(seq 1 120); do
    if curl --fail --silent "$health_url" | grep --quiet '"status":"healthy"'; then
      return
    fi

    if ! "$container_engine" inspect "$container" --format '{{.State.Running}}' 2>/dev/null | grep -q true; then
      "$container_engine" logs "$container"
      return 1
    fi

    sleep 1
  done

  "$container_engine" logs "$container"
  return 1
}

run_container() {
  local container=$1
  local publish="127.0.0.1::3001"

  if [[ -n "$requested_host_port" ]]; then
    publish="127.0.0.1:${requested_host_port}:3001"
  fi

  "$container_engine" run --detach \
    --name "$container" \
    --publish "$publish" \
    --env PORT=3001 \
    --env SQLITE_PATH=/var/data/app.db \
    --mount "type=volume,source=${volume},target=/var/data" \
    "$image" >/dev/null

  host_port=$(
    "$container_engine" port "$container" 3001/tcp \
      | head -n 1 \
      | awk -F: '{ print $NF }'
  )
}

"$container_engine" build \
  --platform linux/amd64 \
  --file deploy/docker/express/Dockerfile \
  --tag "$image" \
  .
"$container_engine" volume create "$volume" >/dev/null

run_container "$first_container"
wait_for_health "$first_container"

# Querying seeded recipes proves that startup ran both migrations and seed data.
curl --fail --silent --show-error "http://127.0.0.1:${host_port}/recipes" \
  | node -e 'let body = ""; process.stdin.on("data", chunk => body += chunk); process.stdin.on("end", () => { const recipes = JSON.parse(body).recipes; if (!Array.isArray(recipes) || recipes.length < 3) process.exit(1); });'

curl --fail --silent --show-error \
  --header 'Content-Type: application/json' \
  --data "{\"title\":\"${recipe_title}\",\"description\":\"persistence check\",\"prepTime\":1,\"cookTime\":1,\"difficulty\":\"Easy\",\"servings\":1,\"categoryId\":\"smoke\",\"ingredients\":[]}" \
  "http://127.0.0.1:${host_port}/recipes" \
  | node -e 'let body = ""; process.stdin.on("data", chunk => body += chunk); process.stdin.on("end", () => { if (!JSON.parse(body).id) process.exit(1); });'

"$container_engine" rm -f "$first_container" >/dev/null
run_container "$second_container"
wait_for_health "$second_container"

# The replacement container must find the row in the reused /var/data volume.
curl --fail --silent --show-error "http://127.0.0.1:${host_port}/recipes?search=${recipe_title}" \
  | RECIPE_TITLE="$recipe_title" node -e 'let body = ""; process.stdin.on("data", chunk => body += chunk); process.stdin.on("end", () => { const recipes = JSON.parse(body).recipes; if (!recipes.some(recipe => recipe.title === process.env.RECIPE_TITLE)) process.exit(1); });'

printf 'Express container smoke test passed (health, migrations, seed, and persistence).\n'
