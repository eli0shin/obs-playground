#!/usr/bin/env bash
set -euo pipefail

agent_pid=""
app_pid=""

otlp_ready() {
  node -e 'const net = require("node:net"); const socket = net.connect({ host: "127.0.0.1", port: 4318 }); socket.on("connect", () => { socket.end(); process.exit(0); }); socket.on("error", () => process.exit(1)); setTimeout(() => process.exit(1), 1000);'
}

cleanup() {
  local exit_code=${1:-0}
  local deadline=$(( $(date +%s) + 10 ))

  for pid in "$app_pid" "$agent_pid"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done

  for pid in "$app_pid" "$agent_pid"; do
    [[ -z "$pid" ]] && continue

    while kill -0 "$pid" 2>/dev/null; do
      if (( $(date +%s) >= deadline )); then
        kill -9 "$pid" 2>/dev/null || true
        break
      fi

      sleep 0.2
    done
  done

  wait "$app_pid" 2>/dev/null || true
  wait "$agent_pid" 2>/dev/null || true

  exit "$exit_code"
}

trap 'cleanup 0' INT TERM

: "${DD_HOSTNAME:?DD_HOSTNAME must be set}"

/bin/entrypoint.sh &
agent_pid=$!

for _ in {1..60}; do
  if otlp_ready; then
    break
  fi

  if ! kill -0 "$agent_pid" 2>/dev/null; then
    echo "Datadog Agent exited before OTLP became ready"
    cleanup 1
  fi

  sleep 1
done

if ! otlp_ready; then
  echo "Timed out waiting for Datadog OTLP HTTP endpoint on 127.0.0.1:4318"
  cleanup 1
fi

./deploy/render/app-with-datadog/run-app.sh &
app_pid=$!

set +e
wait -n "$agent_pid" "$app_pid"
exit_code=$?
set -e

if ! kill -0 "$agent_pid" 2>/dev/null; then
  echo "Datadog Agent exited"
fi

if ! kill -0 "$app_pid" 2>/dev/null; then
  echo "App process exited"
fi

cleanup "$exit_code"
