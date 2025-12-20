# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an OpenTelemetry instrumentation playground demonstrating distributed tracing across a multi-service architecture. The project is a recipe/meal planning application built as a reference implementation for observability patterns, not for production use.

**Architecture:** Next.js frontend → Express API (port 3001) → GraphQL server (port 4000)

**Monorepo:** Uses npm workspaces with Turbo for task orchestration. Structure:

- `apps/*` - Application services (nextjs-app, express-server, graphql-server)
- `packages/*` - Shared libraries (otel for OpenTelemetry configuration)

## Development Commands

### Running the Application

```bash
# Run all services with HTTPS proxy and built-in nextjs server
npm run dev:all

# Run all services with custom Next.js server
npm run dev:all:custom
```

- HTTPS Proxy: https://localhost (requires certs/key.pem and certs/cert.pem)

The HTTPS proxy routes:

- `/` → Next.js (port 3000)
- `/api` → Express (port 3001)
- `/graphql` → GraphQL (port 4000)

### Building and Validation

```bash
# Build all apps (respects Turbo dependency graph)
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Code formatting
npm run format          # Write changes
npm run format:check    # Check only
```

## Architecture

### Service Responsibilities

**Next.js App** (`apps/nextjs-app`):

- Frontend UI with pages for recipes, shopping lists, meal planner, batch nutrition
- Calls Express API for data aggregation
- Routes: `/recipes`, `/shopping-list`, `/batch-nutrition`, `/categories`, `/meal-planner`
- Integrations: Sentry (error tracking), Statsig (feature flags), Vercel OTEL

**Express Server** (`apps/express-server`):

- REST API providing pricing, nutrition, inventory, and orchestration endpoints
- Maintains in-memory data stores (not persistent)
- Calls GraphQL server for recipe data
- Key endpoints:
  - `/ingredients/:id/price`, `/ingredients/prices` - Pricing
  - `/nutrition/ingredient/:id` - Nutrition data
  - `/inventory/stock/:ingredientId` - Stock levels
  - `/shopping-list/generate` - Shopping list from recipe IDs
  - `/meal-plan/estimate` - Cost estimates
  - `/batch/nutrition` - Batch nutrition aggregation

**GraphQL Server** (`apps/graphql-server`):

- Apollo Server providing recipe schema with queries and mutations
- In-memory data: 3 recipes, 10 ingredients, 5 categories
- Queries: `recipe`, `recipeWithCost`, `recipeWithNutrition`, `recipes`, `searchRecipes`
- Mutations: `createRecipe`, `updateRecipe`, `deleteRecipe`
- Calls Express API within resolvers for pricing/nutrition enrichment

### Data Flow

Frontend makes REST calls to Express → Express orchestrates calls to GraphQL → GraphQL resolvers may call back to Express for enrichment. This circular dependency is intentional to demonstrate distributed tracing across complex service interactions.

## OpenTelemetry Instrumentation

**Shared Package:** All OTEL configuration is consolidated in `packages/otel`, a shared workspace package that exports an `initializeOtel()` function. Each app calls this function from its `src/otel.ts` with service-specific configuration.

**Core Setup:** The shared package configures:

- BatchSpanProcessor (batch size: 50, queue: 500, delay: 5s)
- BatchLogRecordProcessor
- PeriodicExportingMetricReader
- OTLP-HTTP exporters to Honeycomb, Grafana, Sentry (multi-backend support)
- W3C Trace Context + W3C Baggage propagators
- Returns a logger instance for each service to use directly (no console bridging)

**Dependency Overrides:** The following versions are pinned to ensure instrumentation compatibility:

```json
"import-in-the-middle": "2.0.0"
"@opentelemetry/instrumentation": "0.207.0"
"require-in-the-middle": "8.0.1"
```

**Patches Applied:** Three patches in `/patches` directory fix instrumentation issues:

- `@opentelemetry+instrumentation-graphql+0.55.0.patch`
- `@opentelemetry+instrumentation-http+0.207.0.patch`
- `next+16.0.0.patch` - Fixes Next.js tracer root span detection

**Span Decoration:** Extensive use of span attributes throughout the codebase to capture:

- Request/response metadata
- Business metrics (pricing ranges, inventory levels, recipe matches)
- Performance metrics (cost calculations, nutrition aggregations)
- Error context (exception recording in active spans)

**Environment Configuration:**

- Shared OTEL config (Honeycomb, Grafana, Sentry credentials) lives in root `.env`
- App-specific variables remain in each app's `.env` file
- All services load both root and app-specific env vars

**Service-Specific Setup:**

- **Next.js:** Custom HTTP instrumentation to ignore dev requests (`/_next/webpack-hmr`, static assets)
- **GraphQL:** Custom GraphQL instrumentation with error recording via `responseHook`
- **Express:** Uses default auto-instrumentation with fs disabled

**Next.js Specifics:**

- `src/instrumentation.ts` registers OTEL via Next.js instrumentation hook
- Only initializes when NOT using custom server (checked via CUSTOM_SERVER env var)
- Custom server mode (`dev:custom`) initializes OTEL in `server.ts`

**Error Handling:**

- Express: Custom error middleware (`error-middleware.ts`) records exceptions in spans
- GraphQL: Apollo Server plugin captures GraphQL errors in spans
- Next.js: Global error boundary (`global-error.tsx`)

## Code Conventions

**TypeScript:**

- Prefer functions and types over classes/interfaces
- Target: ES2022 for backends, ES2017 for Next.js
- Module systems: ESM for GraphQL/root workspace, mixed for Express/Next.js
- When changing a variable prefer to keep its name unless the meaning has fundamentally changed

**ESLint:**

- `no-console` is ERROR globally
- Exceptions: `otel.ts` and `server.ts` files (logging required)
- Next.js uses `eslint-config-next` with core-web-vitals
- Backends use `@typescript-eslint` plugins

**Prettier:**

- Line width: 80 characters
- Trailing commas: all
- Double quotes
- 2-space indentation
- Semicolons enabled

**OpenTelemetry Patterns:**

- Always use optional chaining (`?.`) when calling methods on `activeSpan`
- Never wrap span operations in `if (activeSpan)` blocks
- Good: `activeSpan?.setAttributes({ ... })`
- Bad: `if (activeSpan) { activeSpan.setAttributes({ ... }) }`
- Applies to: `setAttributes()`, `setAttribute()`, `recordException()`, `setStatus()`

**GraphQL Client:**

- ALWAYS use the `graphqlRequest` function from `@obs-playground/graphql-client` for all GraphQL requests
- NEVER use raw `fetch()` calls to `/graphql` or `GRAPHQL_URL`
- The shared client provides automatic error handling and OTEL span instrumentation
- Located at: `packages/graphql-client/src/index.ts`

**Testing:**

- No test framework currently configured
- Observability serves as validation mechanism via span attributes and trace correlation

## Key Files and Locations

**OpenTelemetry Initialization:**

- `packages/otel/src/index.ts` - Shared OTEL initialization and configuration
- `packages/otel/src/exporters.ts` - Multi-backend exporter configuration
- `packages/otel/src/types.ts` - TypeScript types for OTEL config
- `apps/nextjs-app/src/otel.ts` - Next.js-specific instrumentation config
- `apps/express-server/src/otel.ts` - Express-specific instrumentation config
- `apps/graphql-server/src/otel.ts` - GraphQL-specific instrumentation config

**Service Entry Points:**

- `apps/nextjs-app/src/instrumentation.ts` - Next.js instrumentation hook
- `apps/nextjs-app/server.ts` - Custom server mode (alternative to `next dev`)
- `apps/express-server/src/index.ts` - Express app
- `apps/graphql-server/src/index.ts` - Apollo Server setup

**Configuration:**

- `turbo.json` - Turbo task orchestration
- `.prettierrc` - Code formatting rules
- `package.json` (root) - Workspace config and dependency overrides
- `dev-proxy.js` - HTTPS proxy for unified local development

**Error Handling:**

- `apps/express-server/src/error-middleware.ts` - Express error middleware
- `apps/nextjs-app/src/app/global-error.tsx` - Next.js error boundary

## Important Notes

- **Data is in-memory:** No database. Restarting services resets all data.
- **HTTPS proxy requires certificates:** Place `key.pem` and `cert.pem` in `certs/` directory.
- **Batch limits reduced:** OTEL batch sizes are intentionally small (50 spans) to prevent payload errors during high-volume tracing.
- **Multi-backend exports:** All three backends (Honeycomb, Grafana, Sentry) can run simultaneously if environment variables are configured.
- **No testing framework:** This is an instrumentation reference, not a production codebase.
