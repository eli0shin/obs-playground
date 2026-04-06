# OpenTelemetry Instrumentation Playground

A multi-service reference implementation demonstrating distributed tracing with OpenTelemetry across Next.js, Express, and GraphQL.

The repo now includes a single-VM deployment model for main and preview environments using Docker Compose, Caddy, Terraform, and cloud-init.

## Architecture

- **Next.js** (port 3000) - Frontend UI
- **Express API** (port 3001) - REST endpoints for pricing, nutrition, inventory
- **GraphQL Server** (port 4000) - Apollo Server with recipe schema
- **HTTPS Proxy** (port 443) - Unified development server

Services export traces to Honeycomb, Grafana Cloud, Sentry, and Datadog.

## Deployment

Production and preview deployments are designed around one always-on VM:

- One global Caddy edge proxy on `80/443`
- One isolated Docker Compose project for the main stack
- One isolated Docker Compose project per pull request preview
- One stack-local Datadog Agent per deployment stack

Hostnames are expected to follow this pattern:

- Main app: `app.<your-domain>`
- Main custom server: `custom.<your-domain>`
- Main TanStack app: `tanstack.<your-domain>`
- Preview app: `pr-<number>.preview.<your-domain>`
- Preview custom server: `custom-pr-<number>.preview.<your-domain>`
- Preview TanStack app: `tanstack-pr-<number>.preview.<your-domain>`

The deployment assets live in:

- `deploy/compose/stack.yaml`
- `deploy/compose/edge.yaml`
- `deploy/router/Caddyfile.edge`
- `deploy/router/Caddyfile.stack`
- `infra/terraform/`
- `infra/terraform/README.md`
- `infra/cloud-init/user-data.yaml`
- `scripts/deploy-stack.sh`
- `scripts/deploy-preview.sh`
- `scripts/destroy-preview.sh`

## HCP Terraform

Infrastructure is now integrated with HCP Terraform through GitHub Actions.

- `terraform-plan.yml` creates speculative HCP Terraform runs for PRs that change `infra/**`
- `terraform-apply.yml` applies infrastructure changes on `main` when `infra/**` changes
- `deploy.yml` and `preview.yml` read `instance_main_ip` and `deploy_user` from the HCP Terraform workspace outputs before SSH deployment

Set up the HCP Terraform workspace like this:

1. Create an `API-driven` workspace.
2. Set the working directory to `terraform`.
3. Use the repository's `infra` directory as the uploaded configuration root.
4. Keep execution mode as remote unless you have a private-runner requirement.

Required GitHub repository configuration:

- Repository variable: `TF_CLOUD_ORGANIZATION`
- Repository variable: `TF_WORKSPACE_INFRA`
- Repository secret: `TF_API_TOKEN`

Required HCP Terraform workspace variables:

- Environment variable: `VULTR_API_KEY`
- Terraform variable: `instance_region`
- Terraform variable: `deploy_authorized_key`

For the exact HCP Terraform and Vultr bootstrap checklist, see `infra/terraform/README.md`.

Common optional HCP Terraform workspace variables:

- Terraform variable: `domain_name`
- Terraform variable: `instance_plan`
- Terraform variable: `enable_dnssec`
- Terraform variable: `enable_instance_backups`
- Terraform variable: `deploy_user`

App deployment workflows still require GitHub secrets for runtime and deploy configuration:

- `DEPLOY_SSH_KEY`
- `DEPLOY_BASE_DOMAIN`
- `ACME_EMAIL`
- `DD_API_KEY`
- `DD_SITE`
- `HONEYCOMB_ENDPOINT`
- `HONEYCOMB_API_KEY`
- `GRAFANA_OTLP_ENDPOINT`
- `GRAFANA_OTLP_AUTH`
- `SENTRY_OTLP_ENDPOINT`
- `SENTRY_AUTH`
- `SENTRY_AUTH_TOKEN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_STATSIG_CLIENT_KEY`
- `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN`
- `NEXT_PUBLIC_DATADOG_APP_ID`
- `VITE_DATADOG_CLIENT_TOKEN`
- `VITE_DATADOG_APP_ID`

## Prerequisites

- Node.js 18+
- npm 10+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
# Edit .env and replace all placeholder values with your actual API keys
```

3. Generate HTTPS certificates (optional, for proxy):

```bash
mkdir certs
# Add key.pem and cert.pem to certs/ directory
```

## Running

Start all services:

```bash
npm run dev:all     # Built-in Next.js, custom Next.js, Express, GraphQL, TanStack, proxy
npm run dev:dd:all  # Same stack with Datadog native tracing enabled
```

Access the app:

- HTTPS Proxy: https://localhost (requires certificates)
- Next.js: http://localhost:3000
- Express API: http://localhost:3001
- GraphQL Playground: http://localhost:4000/graphql

Using native Datadog tracing requires that you have the datadog agent setup locally with opentelemetry ingest/egress enabled.

## SQLite

If one or two services need lightweight relational storage, keep SQLite files on stack-local persistent volumes. That fits this single-VM deployment model well, but only while the database file remains local to the VM and write concurrency stays modest.

The deployment tooling reserves these service-local data paths:

- Express: `/var/lib/obs/express`
- GraphQL: `/var/lib/obs/graphql`

Use `scripts/backup-sqlite.sh` on the host to snapshot the current service volumes for a stack.

## Development

```bash
npm run build        # Build all apps
npm run type-check   # TypeScript validation
npm run lint         # ESLint
npm run format       # Prettier formatting
```

## Key Features

- Shared OpenTelemetry configuration in `packages/otel`
- Multi-backend trace export (Honeycomb, Grafana, Sentry)
- Extensive span attributes for business and performance metrics
- Distributed tracing across circular service dependencies
- In-memory data stores (no database required)

## Documentation

See `CLAUDE.md` for detailed architecture, conventions, and OpenTelemetry setup.
