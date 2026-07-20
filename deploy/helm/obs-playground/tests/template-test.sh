#!/usr/bin/env bash
set -euo pipefail

for command in helm kubeconform yq; do
  command -v "${command}" >/dev/null || {
    printf 'Required command not found: %s\n' "${command}" >&2
    exit 1
  }
done

chart_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
values_file="${chart_dir}/tests/representative-values.yaml"
rendered=$(mktemp)
rendered_json=$(mktemp)
long_rendered=$(mktemp)
long_rendered_json=$(mktemp)
trap 'rm -f "${rendered}" "${rendered_json}" "${long_rendered}" "${long_rendered_json}"' EXIT

helm lint "${chart_dir}"
helm template test "${chart_dir}" --values "${values_file}" > "${rendered}"
kubeconform -strict -summary < "${rendered}"
yq eval-all -o=json -I=0 '.' "${rendered}" > "${rendered_json}"

long_release=$(printf 'r%.0s' {1..50})
helm template "${long_release}" "${chart_dir}" > "${long_rendered}"
kubeconform -strict -summary < "${long_rendered}"
yq eval-all -o=json -I=0 '.' "${long_rendered}" > "${long_rendered_json}"

python3 - "${rendered_json}" "${long_rendered_json}" <<'PY'
import json
import sys
from pathlib import Path

objects = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines()]
resources = {(obj["kind"], obj["metadata"]["name"]): obj for obj in objects}

def resource(kind, name):
    value = resources.get((kind, name))
    assert value is not None, f"missing {kind}/{name}"
    return value

prefix = "test-obs-playground"
components = ["graphql", "express", "nextjs", "nextjs-custom", "tanstack"]
assert sum(obj["kind"] == "Deployment" for obj in objects) == 5
assert sum(obj["kind"] == "Service" for obj in objects) == 5
assert sum(obj["kind"] == "Ingress" for obj in objects) == 5

expected_replicas = {"graphql": 2, "express": 1, "nextjs": 3, "nextjs-custom": 4, "tanstack": 5}
expected_container_ports = {"graphql": 4000, "express": 3001, "nextjs": 3000, "nextjs-custom": 3000, "tanstack": 3000}
expected_service_ports = {**expected_container_ports, "graphql": 80}
expected_images = {component: f"ghcr.io/eli0shin/obs-playground-{component}:0.1.0" for component in components}

def deployment_details(component):
    deployment = resource("Deployment", f"{prefix}-{component}")
    spec = deployment["spec"]
    pod_spec = spec["template"]["spec"]
    assert len(pod_spec["containers"]) == 1
    container = pod_spec["containers"][0]
    env_entries = container["env"]
    env_names = [entry["name"] for entry in env_entries]
    assert len(env_names) == len(set(env_names)), f"duplicate environment name in {component}"
    return deployment, spec, pod_spec, container, {entry["name"]: entry.get("value") for entry in env_entries}

for component in components:
    name = f"{prefix}-{component}"
    _, spec, _, container, env = deployment_details(component)
    assert spec["replicas"] == expected_replicas[component]
    assert spec["strategy"]["type"] == ("Recreate" if component == "express" else "RollingUpdate")
    assert container["image"] == expected_images[component]
    assert container["ports"] == [{"name": "http", "containerPort": expected_container_ports[component], "protocol": "TCP"}]
    assert env["PORT"] == str(expected_container_ports[component])
    assert env["DATADOG_OTLP_PROTOCOL"] == "grpc"
    assert env["DATADOG_OTLP_ENDPOINT"] == "http://datadog-agent.monitoring.svc.cluster.local:4317"
    assert container["readinessProbe"]["httpGet"] == {"path": "/health", "port": "http"}
    assert container["livenessProbe"]["httpGet"] == {"path": "/health", "port": "http"}
    assert set(container["resources"]) == {"requests", "limits"}

    service = resource("Service", name)
    assert service["spec"]["selector"] == spec["selector"]["matchLabels"]
    assert service["spec"]["ports"] == [{"name": "http", "port": expected_service_ports[component], "targetPort": "http", "protocol": "TCP"}]

    ingress = resource("Ingress", name)
    rule = ingress["spec"]["rules"][0]
    assert rule["host"] == f"{component}.example.test"
    assert rule["http"]["paths"][0]["backend"]["service"] == {"name": name, "port": {"name": "http"}}

_, _, express_pod, _, express_env = deployment_details("express")
assert express_pod["securityContext"] == {"fsGroup": 1000, "fsGroupChangePolicy": "OnRootMismatch"}
assert express_env["SQLITE_PATH"] == "/var/data/app.db"
assert express_env["EXAMPLE_RUNTIME_SETTING"] == "configured-at-runtime"
assert express_pod["volumes"] == [{"name": "data", "persistentVolumeClaim": {"claimName": f"{prefix}-express-data"}}]
express_container = express_pod["containers"][0]
assert express_container["volumeMounts"] == [{"name": "data", "mountPath": "/var/data"}]

pvc = resource("PersistentVolumeClaim", f"{prefix}-express-data")
assert pvc["spec"]["storageClassName"] == "test-storage"
assert pvc["spec"]["resources"]["requests"]["storage"] == "2Gi"

_, _, _, _, graphql_env = deployment_details("graphql")
assert graphql_env["EXPRESS_BASE_URL"] == f"http://{prefix}-express:3001"
for component in ["express", "nextjs", "nextjs-custom", "tanstack"]:
    _, _, _, _, env = deployment_details(component)
    assert env["GRAPHQL_BASE_URL"] == f"http://{prefix}-graphql:80"
for component in ["nextjs", "nextjs-custom", "tanstack"]:
    _, _, _, _, env = deployment_details(component)
    assert env["EXPRESS_BASE_URL"] == f"http://{prefix}-express:3001"
    assert env["PUBLIC_GRAPHQL_BASE_URL"] == "https://graphql.example.test"
    assert env["PUBLIC_EXPRESS_BASE_URL"] == "https://express.example.test"

long_objects = [json.loads(line) for line in Path(sys.argv[2]).read_text().splitlines()]
for kind in ["Deployment", "Service"]:
    names = [obj["metadata"]["name"] for obj in long_objects if obj["kind"] == kind]
    assert len(names) == len(set(names)) == 5
    for component in components:
        assert sum(name.endswith(f"-{component}") for name in names) == 1
    assert all(len(name) <= 63 for name in names)

long_pvc = next(obj for obj in long_objects if obj["kind"] == "PersistentVolumeClaim")
assert long_pvc["metadata"]["name"].endswith("-express-data")
assert len(long_pvc["metadata"]["name"]) <= 63
PY

if helm template test "${chart_dir}" --set workloads.graphql.ingress.enabled=true >/dev/null 2>&1; then
  echo "enabled ingress without hosts unexpectedly rendered" >&2
  exit 1
fi

if helm template test "${chart_dir}" \
  --set workloads.graphql.ingress.enabled=true \
  --set workloads.graphql.ingress.hosts[0].host=graphql.example.test >/dev/null 2>&1; then
  echo "enabled ingress without paths unexpectedly rendered" >&2
  exit 1
fi
