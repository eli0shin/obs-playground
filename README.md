# OpenTelemetry Instrumentation Playground

A multi-service reference implementation demonstrating distributed tracing with OpenTelemetry across Next.js, Express, and GraphQL.

## Architecture

- **Next.js** - Frontend UI
- **Next.js custom server** - Alternate frontend tracing path
- **Express API** - REST endpoints for pricing, nutrition, inventory
- **GraphQL Server** - Apollo Server with recipe schema
- **TanStack Start** - Alternate frontend
- **Portless** - Worktree-aware named development URLs

Services export traces to Honeycomb, Grafana Cloud, Sentry, and Datadog.

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

## Running

Start all services:

```bash
npm run dev
npm run dev:dd     # With built-in Next.js server and Datadog native tracing
```

Access the app:

- Next.js: https://obs-playground.localhost
- Next.js custom server: https://custom.obs-playground.localhost
- Express API: https://api.obs-playground.localhost
- GraphQL Playground: https://graphql.obs-playground.localhost/graphql
- TanStack Start: https://tanstack.obs-playground.localhost

Linked git worktrees get the branch name as a subdomain prefix, for example
`https://my-branch.obs-playground.localhost`.

Using native Datadog tracing requires that you have the datadog agent setup locally with opentelemetry ingest/egress enabled.

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
