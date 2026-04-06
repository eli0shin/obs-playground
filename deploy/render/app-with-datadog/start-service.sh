#!/usr/bin/env bash
set -euo pipefail

agent_pid=""
app_pid=""

cleanup() {
  local exit_code=${1:-0}

  if [[ -n "$app_pid" ]] && kill -0 "$app_pid" 2>/dev/null; then
    kill "$app_pid" 2>/dev/null || true
  fi

  if [[ -n "$agent_pid" ]] && kill -0 "$agent_pid" 2>/dev/null; then
    kill "$agent_pid" 2>/dev/null || true
  fi

  wait "$app_pid" 2>/dev/null || true
  wait "$agent_pid" 2>/dev/null || true

  exit "$exit_code"
}

trap 'cleanup 0' INT TERM

/bin/entrypoint.sh &
agent_pid=$!

for _ in {1..60}; do
  if node -e 'const net = require("node:net"); const socket = net.connect({ host: "127.0.0.1", port: 4318 }); socket.on("connect", () => { socket.end(); process.exit(0); }); socket.on("error", () => process.exit(1)); setTimeout(() => process.exit(1), 1000);'; then
    break
  fi

  if ! kill -0 "$agent_pid" 2>/dev/null; then
    echo "Datadog Agent exited before OTLP became ready"
    cleanup 1
  fi

  sleep 1
done

if ! node -e 'const net = require("node:net"); const socket = net.connect({ host: "127.0.0.1", port: 4318 }); socket.on("connect", () => { socket.end(); process.exit(0); }); socket.on("error", () => process.exit(1)); setTimeout(() => process.exit(1), 1000);'; then
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
