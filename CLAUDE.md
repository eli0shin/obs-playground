## Project Overview

This is an OpenTelemetry instrumentation playground demonstrating distributed tracing across a multi-service architecture. The project is a recipe/meal planning application built as a reference implementation for observability patterns, not for production use.

**Architecture:** Next.js frontend → Express API (port 3001) → GraphQL server (port 4000)

**Monorepo:** Uses npm workspaces with Turbo for task orchestration. Structure:

- `apps/*` - Application services (nextjs-app, express-server, graphql-server)
- `packages/*` - Shared libraries (otel for OpenTelemetry configuration)

## Development Commands

### Running the Application

```bash
# Run all services with HTTPS proxy
npm run dev
```

- Portless proxy: https://obs-playground.localhost

Portless routes:

- `https://obs-playground.localhost` → Next.js
- `https://custom.obs-playground.localhost` → Next.js custom server
- `https://api.obs-playground.localhost` → Express
- `https://graphql.obs-playground.localhost` → GraphQL
- `https://tanstack.obs-playground.localhost` → TanStack Start

### Validation

```bash
# Run playwright tests
npm run playwright

# Type checking
npm run type-check

# Linting
npm run lint
```

## Code Conventions

**TypeScript:**

- Prefer functions and types over classes/interfaces
- Target: ES2022 for backends, ES2017 for Next.js
- Module systems: ESM for GraphQL/root workspace, mixed for Express/Next.js
- When changing a variable prefer to keep its name unless the meaning has fundamentally changed

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
