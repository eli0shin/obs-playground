# OBS Playground Helm chart

This chart deploys GraphQL, Express, standard Next.js, custom-server Next.js, and TanStack Start. It contains no ingress hostnames, credentials, authentication middleware, or cluster-specific resources by default.

## Runtime configuration

The chart derives internal `GRAPHQL_BASE_URL` and `EXPRESS_BASE_URL` values from the release's Kubernetes Services. Set `publicBaseUrls.graphql` and `publicBaseUrls.express` to the browser-reachable ingress origins; frontends inject these public values into browser pages while retaining cluster-local URLs for server-side requests. Shared runtime variables can be supplied with `global.env`, and service-specific variables with `workloads.<service>.env`; both accept Kubernetes `EnvVar` objects, including `secretKeyRef` values.

Set `datadog.otlpEndpoint` to an existing OTLP receiver to export telemetry. The default `datadog.otlpProtocol` is `grpc`; the chart does not deploy a Datadog Agent or accept Datadog credentials.

Express always runs one replica with the `Recreate` strategy and mounts its PVC at `/var/data`. Its pod uses the image's node group (GID 1000) as `fsGroup` so dynamically provisioned volumes are writable. Set `persistence.storageClass` and `persistence.capacity`, or provide `persistence.existingClaim` to reuse a claim.

Each ingress is disabled by default and can be configured independently under `workloads.<service>.ingress`. Browser-visible `NEXT_PUBLIC_*` and `VITE_*` settings are compiled into the frontend images and must be supplied when those images are built; Helm values configure the server runtimes.

## Health probes

All five workloads use `/health` for startup, readiness, and liveness checks. Kubernetes does not run readiness or liveness checks until the startup probe succeeds, preventing slower services from being restarted before they begin listening. Configure the shared startup-probe contract under `probes.startup`:

```yaml
probes:
  startup:
    path: /health
    port: http
    periodSeconds: 5
    timeoutSeconds: 2
    failureThreshold: 30
```

The startup window is `periodSeconds * failureThreshold`; the default allows 150 seconds. Keep `port` set to the named HTTP container port unless you also adapt the workload ports.

## Validation

The representative test requires Helm, kubeconform, yq v4, and Python 3.

```bash
helm lint deploy/helm/obs-playground
deploy/helm/obs-playground/tests/template-test.sh
```
