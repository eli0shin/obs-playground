# OpenTelemetry Instrumentation Playground

A multi-service reference implementation demonstrating distributed tracing with OpenTelemetry across Next.js, Express, and GraphQL.

## Architecture

- **Next.js** (port 3000) - Frontend UI
- **Express API** (port 3001) - REST endpoints for pricing, nutrition, inventory
- **GraphQL Server** (port 4000) - Apollo Server with recipe schema
- **HTTPS Proxy** (port 443) - Unified development server

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

3. Generate HTTPS certificates (optional, for proxy):

```bash
mkdir certs
# Add key.pem and cert.pem to certs/ directory
```

## Running

Start all services:

```bash
npm run dev:all        # With built-in Next.js server
npm run dev:all:custom # With custom Next.js server
npm run dev:dd:all     # With built-in Next.js server and Datadog native tracing
npm run dev:dd:custom  # With custom Next.js server and Datadog native tracing
```

Access the app:

- HTTPS Proxy: https://localhost (requires certificates)
- Next.js: http://localhost:3000
- Express API: http://localhost:3001
- GraphQL Playground: http://localhost:4000/graphql

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
