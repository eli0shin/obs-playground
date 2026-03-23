# TanStack Start App: Implementation Plan

## Overview

Add a TanStack Start app at `apps/tanstack-start` (port 3100) to the existing observability playground monorepo. The app duplicates all 23 pages from the Next.js app, integrates OTEL via the shared `@obs-playground/otel` package, and adds Sentry via the alpha `@sentry/tanstackstart-react` SDK. It is proxied at `/tanstack` through the HTTPS dev proxy.

---

## Phase 1: Scaffold and Monorepo Integration

### 1.1 Scaffold the app

Run `npm create @tanstack/start@latest` inside `apps/`, selecting file-based routing with TypeScript and Tailwind CSS. Name the directory `tanstack-start`.

After scaffolding, delete the generated example routes (keep `__root.tsx`) and any example components.

### 1.2 Configure `package.json`

**File: `apps/tanstack-start/package.json`**

```jsonc
{
  "name": "tanstack-start",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 3100",
    "build": "vite build",
    "start": "node .output/server/index.mjs",
    "type-check": "tsc --noEmit",
    "lint": "eslint",
  },
  "dependencies": {
    "@obs-playground/env": "*",
    "@obs-playground/graphql-client": "*",
    "@obs-playground/otel": "*",
    "@opentelemetry/api": "^1.9.0",
    "@sentry/tanstackstart-react": "^10.45.0",
    "@tanstack/react-router": "latest",
    "@tanstack/react-start": "latest",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "zod": "^4.2.1",
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "latest",
    "eslint": "^9",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vite": "latest",
    "vite-tsconfig-paths": "latest",
  },
}
```

### 1.3 Configure `vite.config.ts`

**File: `apps/tanstack-start/vite.config.ts`**

The base path `/tanstack` ensures all assets and routes are served under that prefix when accessed through the HTTPS proxy.

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/tanstack",
  server: {
    port: 3100,
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    sentryTanstackStart({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
    viteReact(),
  ],
});
```

### 1.4 Configure `tsconfig.json`

**File: `apps/tanstack-start/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": ".",
    "paths": {
      "~/*": ["./src/*"]
    }
  },
  "include": ["src", "vite.config.ts"],
  "exclude": ["node_modules", "dist", ".output"]
}
```

### 1.5 Update root monorepo files

**File: `tsconfig.json` (root)** -- Add project reference:

```json
{ "path": "./apps/tanstack-start" }
```

**File: `turbo.json`** -- Add `.output/**` to the `build` task outputs:

```jsonc
"outputs": [".next/**", "!.next/cache/**", "dist/**", ".output/**"]
```

---

## Phase 2: OTEL Integration

### 2.1 Approach: `--import` flag with custom instrumentation file

Source: The Express server uses `tsx watch --import ./src/otel.ts` to ensure OTEL is initialized before any application code. TanStack Start runs on Vite in dev and produces a Node.js server in production. The approach:

- **Dev:** Use the `--import` flag on the Vite dev command via Node options
- **Production:** Use `--import` on the `node` command that runs the built server

This ensures the OTEL NodeSDK registers auto-instrumentation hooks before Vite/the app loads any modules, matching how Express and GraphQL servers work in this monorepo.

### 2.2 Create `src/otel.ts`

**File: `apps/tanstack-start/src/otel.ts`**

```ts
import { initializeOtel } from "@obs-playground/otel";

initializeOtel({
  serviceName: "tanstack-start-app",
  instrumentations: {
    "@opentelemetry/instrumentation-http": {
      ignoreIncomingRequestHook: (request) => {
        const url = request.url ?? "";
        // Ignore Vite HMR and internal requests
        return url.startsWith("/@") || url.startsWith("/__vite");
      },
    },
  },
});
```

### 2.3 Update dev script

**File: `apps/tanstack-start/package.json`** -- Modify the `dev` script:

```json
"dev": "NODE_OPTIONS='--import ./src/otel.ts --env-file=../../.env' vite --port 3100"
```

**Caveat:** The `--import` flag requires the imported file to be resolvable as ESM from the working directory. Since `@obs-playground/otel` is a compiled workspace package (outputs `.js`), and `src/otel.ts` imports it, we need to either:

1. Pre-compile `src/otel.ts` to a standalone `.mjs` file, OR
2. Use `tsx` as the loader: `NODE_OPTIONS='--import tsx/esm' tsx --import ./src/otel.ts ...`

**Recommended:** Create a pre-compiled OTEL entry:

**File: `apps/tanstack-start/src/instrument.mjs`**

```js
// This file is executed via --import before the app starts.
// It must be plain JS because it runs before Vite/tsx processes TS.
import { initializeOtel } from "@obs-playground/otel";

initializeOtel({
  serviceName: "tanstack-start-app",
  instrumentations: {
    "@opentelemetry/instrumentation-http": {
      ignoreIncomingRequestHook: (request) => {
        const url = request.url ?? "";
        return url.startsWith("/@") || url.startsWith("/__vite");
      },
    },
  },
});
```

Then the scripts become:

```json
"dev": "node --env-file=../../.env --import ./src/instrument.mjs node_modules/.bin/vite --port 3100",
"start": "node --env-file=../../.env --import ./src/instrument.mjs .output/server/index.mjs"
```

**Alternative (simpler, but less reliable auto-instrumentation):** Initialize OTEL in `src/server.ts` before the handler import, which is how the TanStack Start + Better Stack guide does it. This approach may miss some HTTP spans because the server entry loads after Vite's dev server:

**File: `apps/tanstack-start/src/server.ts`**

```ts
import "./otel";
import handler from "@tanstack/react-start/server-entry";

export default {
  fetch(request: Request) {
    return handler.fetch(request);
  },
};
```

**Recommendation:** Start with the `server.ts` approach (simpler, guaranteed to work). If auto-instrumentation coverage is insufficient, migrate to the `--import` approach. Document both options.

### 2.4 Create `.env.local`

**File: `apps/tanstack-start/.env.local`**

```
GRAPHQL_BASE_URL=http://localhost:4000
EXPRESS_BASE_URL=http://localhost:3001
```

The root `.env` provides Honeycomb/Grafana/Sentry/Datadog credentials. The app-specific `.env.local` provides service URLs.

---

## Phase 3: Sentry Integration

### 3.1 Client-side Sentry

**File: `apps/tanstack-start/src/router.tsx`**

```tsx
import * as Sentry from "@sentry/tanstackstart-react";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    basepath: "/tanstack",
    scrollRestoration: true,
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
  });

  // Initialize Sentry on the client only
  if (!router.isServer) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      tracesSampleRate: 0, // Disable Sentry tracing; we use OTEL
    });
  }

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
```

### 3.2 Server-side Sentry

**File: `apps/tanstack-start/src/instrument.server.mjs`**

```js
import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0, // Disable Sentry tracing to avoid conflict with OTEL
});
```

Reference this via `--import ./src/instrument.server.mjs` in the dev/start scripts, chained after the OTEL import. Or import it at the top of `src/server.ts` after the OTEL import.

### 3.3 Global middleware for Sentry

**File: `apps/tanstack-start/src/global-middleware.ts`**

```ts
import { sentryGlobalServerMiddlewareHandler } from "@sentry/tanstackstart-react";
import {
  createMiddleware,
  registerGlobalMiddleware,
} from "@tanstack/react-start";

registerGlobalMiddleware({
  middleware: [
    createMiddleware({ type: "function" }).server(
      sentryGlobalServerMiddlewareHandler(),
    ),
  ],
});
```

### 3.4 `vite.config.ts` already includes `sentryTanstackStart` (see Phase 1.3)

### 3.5 Add env vars

**File: `.env.example` (root)** -- Append:

```
VITE_SENTRY_DSN=https://your_sentry_key@oYOUR_ORG_ID.ingest.us.sentry.io/YOUR_TANSTACK_PROJECT_ID
```

---

## Phase 4: App Shell and Routing Foundation

### 4.1 Router configuration

**File: `apps/tanstack-start/src/router.tsx`** (shown above in Phase 3.1)

Key settings:

- `basepath: "/tanstack"` -- all routes are prefixed with `/tanstack` to match the proxy
- `scrollRestoration: true`
- Custom `defaultErrorComponent` and `defaultNotFoundComponent`

### 4.2 Root route

**File: `apps/tanstack-start/src/routes/__root.tsx`**

```tsx
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [
      // Tailwind CSS is handled by Vite plugin
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
```

### 4.3 Client entry

**File: `apps/tanstack-start/src/client.tsx`**

```tsx
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";
import { createRouter } from "./router";

const router = createRouter();

hydrateRoot(document, <StartClient router={router} />);
```

### 4.4 SSR entry

**File: `apps/tanstack-start/src/ssr.tsx`**

```tsx
import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { createRouter } from "./router";

export default createStartHandler({
  createRouter,
})(defaultStreamHandler);
```

### 4.5 Server entry

**File: `apps/tanstack-start/src/server.ts`**

```ts
import "./otel";
import handler from "@tanstack/react-start/server-entry";

export default {
  fetch(request: Request) {
    return handler.fetch(request);
  },
};
```

### 4.6 Shared components

Create reusable error/not-found components:

**File: `apps/tanstack-start/src/components/DefaultCatchBoundary.tsx`**

```tsx
import { Link, ErrorComponent } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold text-red-600">
          Something went wrong
        </h1>
        <ErrorComponent error={error} />
        <Link
          to="/"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
```

**File: `apps/tanstack-start/src/components/NotFound.tsx`**

```tsx
import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Page Not Found
        </h1>
        <Link
          to="/"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
```

---

## Phase 5: Server Functions

### 5.1 Organization

Server functions live in `src/server-fns/` organized by domain. Each file exports `createServerFn` instances that the route loaders call. This keeps data-fetching logic separate from route UI.

```
src/server-fns/
  recipes.ts       -- GraphQL queries for recipes (getRecipe, getRecipes, getRecipeWithCost, etc.)
  categories.ts    -- GraphQL queries for categories
  shopping-list.ts -- Express POST to /shopping-list/generate
  meal-planner.ts  -- Express GET to /meal-plan/estimate
  nutrition.ts     -- Express POST to /batch/nutrition, per-ingredient nutrition
  inventory.ts     -- Express GET to /inventory/stock/:id
  mutations.ts     -- GraphQL mutations (createRecipe, brokenCreateRecipe)
```

### 5.2 Pattern: Server function with OTEL span attributes

```ts
// src/server-fns/recipes.ts
import { createServerFn } from "@tanstack/react-start";
import { graphqlRequest } from "@obs-playground/graphql-client";
import { trace } from "@opentelemetry/api";

type Recipe = {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

export const getRecipesAndCategories = createServerFn({
  method: "GET",
}).handler(async () => {
  const activeSpan = trace.getActiveSpan();
  activeSpan?.setAttributes({
    "server_fn.name": "getRecipesAndCategories",
  });

  return graphqlRequest<{ recipes: Recipe[]; categories: Category[] }>(`
      query GetRecipesAndCategories {
        recipes {
          id title description prepTime cookTime difficulty servings
        }
        categories {
          id name slug
        }
      }
    `);
});

export const getRecipe = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const activeSpan = trace.getActiveSpan();
    activeSpan?.setAttributes({
      "server_fn.name": "getRecipe",
      "recipe.id": id,
    });

    const result = await graphqlRequest<{ recipe: Recipe | null }>(
      `query GetRecipe($id: ID!) {
        recipe(id: $id) {
          id title description prepTime cookTime difficulty servings
          ingredients { ingredient { id name unit } quantity }
        }
      }`,
      { id },
    );

    return result.recipe;
  });
```

### 5.3 Pattern: Server function calling Express

```ts
// src/server-fns/shopping-list.ts
import { createServerFn } from "@tanstack/react-start";
import { getExpressUrl } from "@obs-playground/env";
import { trace } from "@opentelemetry/api";
import { z } from "zod";

const shoppingListResponseSchema = z.object({
  items: z.array(
    z.object({
      ingredientId: z.string(),
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      pricePerUnit: z.number(),
      totalCost: z.number(),
      inStock: z.boolean(),
    }),
  ),
  totalCost: z.number(),
  outOfStock: z.array(z.string()),
  recipeCount: z.number(),
});

export const generateShoppingList = createServerFn({ method: "GET" })
  .inputValidator((data: { recipeIds: string[]; isDefault: boolean }) => data)
  .handler(async ({ data }) => {
    const activeSpan = trace.getActiveSpan();
    activeSpan?.setAttributes({
      "shopping_list.recipe_ids": data.recipeIds.join(","),
      "shopping_list.recipe_count": data.recipeIds.length,
      "shopping_list.using_default_ids": data.isDefault,
    });

    const response = await fetch(`${getExpressUrl()}/shopping-list/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeIds: data.recipeIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate shopping list: ${response.status}`);
    }

    const json: unknown = await response.json();
    const result = shoppingListResponseSchema.parse(json);

    activeSpan?.setAttributes({
      "shopping_list.total_items": result.items.length,
      "shopping_list.total_cost": result.totalCost,
      "shopping_list.out_of_stock_count": result.outOfStock.length,
    });

    return result;
  });
```

### 5.4 Pattern: Server function for mutations (POST)

```ts
// src/server-fns/mutations.ts
import { createServerFn } from "@tanstack/react-start";
import { graphqlRequest } from "@obs-playground/graphql-client";
import { trace } from "@opentelemetry/api";

type CreateRecipeInput = {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  categoryId: string;
  ingredients: Array<{ ingredientId: string; quantity: number }>;
};

export const createRecipe = createServerFn({ method: "POST" })
  .inputValidator((data: CreateRecipeInput) => data)
  .handler(async ({ data }) => {
    const activeSpan = trace.getActiveSpan();
    activeSpan?.setAttributes({
      "recipe.title": data.title,
      "recipe.difficulty": data.difficulty,
      "recipe.ingredient_count": data.ingredients.length,
    });

    const result = await graphqlRequest<{
      createRecipe: { id: string; title: string; description: string };
    }>(
      `mutation CreateRecipe($input: CreateRecipeInput!) {
        createRecipe(input: $input) { id title description }
      }`,
      {
        input: {
          recipe: {
            title: data.title,
            description: data.description,
            prepTime: data.prepTime,
            cookTime: data.cookTime,
            difficulty: data.difficulty,
            servings: data.servings,
            categoryId: data.categoryId,
          },
          ingredients: data.ingredients,
        },
      },
    );

    activeSpan?.setAttributes({ "recipe.id": result.createRecipe.id });

    return result.createRecipe;
  });

export const brokenCreateRecipe = createServerFn({ method: "POST" }).handler(
  async () => {
    return graphqlRequest<{ errorMutation: string }>(
      `mutation ErrorMutation { errorMutation(input: "test") }`,
    );
  },
);
```

---

## Phase 6: Route Implementation (All 23 Pages)

### 6.1 Next.js -> TanStack Start Pattern Mapping

| Next.js Pattern                          | TanStack Start Equivalent                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| `app/page.tsx` (async server component)  | `src/routes/index.tsx` with `loader` calling `createServerFn`                    |
| `app/[id]/page.tsx` (dynamic param)      | `src/routes/$id.tsx` or `src/routes/$id/index.tsx`                               |
| `searchParams: { ids?: string }`         | `validateSearch: z.object({ ids: z.string().optional() })` + `Route.useSearch()` |
| `export const dynamic = "force-dynamic"` | Default behavior (loaders run on every SSR request)                              |
| `Link from "next/link"`                  | `Link from "@tanstack/react-router"`                                             |
| `redirect("/path")`                      | `throw redirect({ to: "/path" })`                                                |
| Server Actions (`"use server"`)          | `createServerFn({ method: "POST" })`                                             |
| `<Suspense>` with async children         | `pendingComponent` on route + `Await` or deferred loader data                    |
| `error.tsx` / Error boundary             | `errorComponent` on route                                                        |
| `layout.tsx` wrapping children           | Parent route with `<Outlet />`                                                   |
| `"use client"` components                | Regular React components (TanStack Start is universal by default)                |
| `next/link` href paths                   | `Link` `to` prop with typed routes                                               |

### 6.2 Route file structure

```
src/routes/
  __root.tsx                              -- HTML shell, <Outlet />
  index.tsx                               -- / (home)
  categories/
    $slug.tsx                             -- /categories/$slug
  recipes/
    $id/
      index.tsx                           -- /recipes/$id
      with-cost.tsx                       -- /recipes/$id/with-cost
      nutrition.tsx                       -- /recipes/$id/nutrition
      full.tsx                            -- /recipes/$id/full
    compare.tsx                           -- /recipes/compare
    new.tsx                               -- /recipes/new
  shopping-list/
    index.tsx                             -- /shopping-list
  meal-planner/
    index.tsx                             -- /meal-planner
  batch-nutrition/
    index.tsx                             -- /batch-nutrition
  testing/
    errors/
      index.tsx                           -- /testing/errors (hub)
      500.tsx                             -- /testing/errors/500
      not-found.tsx                       -- /testing/errors/not-found
      express-error.tsx                   -- /testing/errors/express-error
      graphql-error.tsx                   -- /testing/errors/graphql-error
      timeout.tsx                         -- /testing/errors/timeout
      partial-failure.tsx                 -- /testing/errors/partial-failure
      suspense-error.tsx                  -- /testing/errors/suspense-error
      nested-suspense.tsx                 -- /testing/errors/nested-suspense
    forms/
      broken-create.tsx                   -- /testing/forms/broken-create
    client/
      broken-api.tsx                      -- /testing/client/broken-api
      broken-mutation.tsx                 -- /testing/client/broken-mutation
```

### 6.3 Example: Home page (`/`)

**File: `apps/tanstack-start/src/routes/index.tsx`**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { getRecipesAndCategories } from "~/server-fns/recipes";

export const Route = createFileRoute("/")({
  loader: () => getRecipesAndCategories(),
  component: HomePage,
});

function HomePage() {
  const { recipes, categories } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Recipe &amp; Meal Planning
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            OpenTelemetry Playground (TanStack Start) - Browse recipes and plan
            your meals
          </p>
        </header>

        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Browse by Category
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to="/categories/$slug"
                params={{ slug: category.slug }}
                className="rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
              >
                <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        {/* ... rest of the page follows the same JSX as Next.js,
             replacing <Link href="..."> with <Link to="..." params={...}> */}
      </div>
    </div>
  );
}
```

### 6.4 Example: Dynamic route with params (`/recipes/$id`)

**File: `apps/tanstack-start/src/routes/recipes/$id/index.tsx`**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { getRecipe } from "~/server-fns/recipes";

export const Route = createFileRoute("/recipes/$id/")({
  loader: ({ params }) => getRecipe({ data: params.id }),
  component: RecipePage,
});

function RecipePage() {
  const recipe = Route.useLoaderData();

  if (!recipe) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Recipe not found
          </h1>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    /* Same JSX as Next.js version, using <Link to="/recipes/$id/with-cost" params={{ id: recipe.id }}> */
  );
}
```

### 6.5 Example: Route with search params (`/recipes/compare`)

**File: `apps/tanstack-start/src/routes/recipes/compare.tsx`**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { getRecipesWithCost } from "~/server-fns/recipes";

const searchSchema = z.object({
  ids: z.string().optional(),
});

export const Route = createFileRoute("/recipes/compare")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ ids: search.ids }),
  loader: ({ deps }) => {
    const ids = deps.ids ? deps.ids.split(",") : ["1", "2"];
    return getRecipesWithCost({ data: ids });
  },
  component: CompareRecipesPage,
});

function CompareRecipesPage() {
  const recipes = Route.useLoaderData();
  // ... same JSX as Next.js
}
```

### 6.6 Example: Error page (`/testing/errors/500`)

**File: `apps/tanstack-start/src/routes/testing/errors/500.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/testing/errors/500")({
  loader: () => {
    throw new Error("Intentional 500 error during page load");
  },
  component: () => null, // Never renders
});
```

### 6.7 Example: Suspense-equivalent (`/testing/errors/suspense-error`)

TanStack Start doesn't use React `<Suspense>` the same way Next.js does. The equivalent uses `pendingComponent` and deferred data with `Await`:

**File: `apps/tanstack-start/src/routes/testing/errors/suspense-error.tsx`**

```tsx
import { createFileRoute, Link, Await } from "@tanstack/react-router";

async function delayedError(): Promise<never> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  throw new Error(
    "Suspense component failed after streaming started (2s delay)",
  );
}

export const Route = createFileRoute("/testing/errors/suspense-error")({
  loader: () => ({
    // Return a promise that will be streamed
    delayedData: delayedError(),
  }),
  pendingComponent: () => (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 dark:border-blue-800 dark:bg-blue-950">
      <div className="flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="ml-3 text-blue-800 dark:text-blue-200">
          Loading component...
        </span>
      </div>
    </div>
  ),
  component: SuspenseErrorPage,
  errorComponent: ({ error }) => (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
      <h3 className="font-medium text-red-900 dark:text-red-100">Error</h3>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
        {error instanceof Error ? error.message : "Unknown error"}
      </p>
    </div>
  ),
});

function SuspenseErrorPage() {
  const { delayedData } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          to="/testing/errors"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline"
        >
          &larr; Back to error testing
        </Link>
        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Suspense Error Test
          </h1>
          <div className="mt-8">
            <Await promise={delayedData} fallback={<div>Loading...</div>}>
              {(data) => <div>{JSON.stringify(data)}</div>}
            </Await>
          </div>
        </article>
      </div>
    </div>
  );
}
```

### 6.8 Example: Nested suspense (`/testing/errors/nested-suspense`)

Uses multiple deferred promises in the loader -- one that succeeds after 1s and one that fails after 1.5s:

```tsx
export const Route = createFileRoute("/testing/errors/nested-suspense")({
  loader: () => ({
    successData: fetchRecipeDelayed(), // Resolves after 1s
    errorData: fetchAndFail(), // Rejects after 1.5s
  }),
  component: NestedSuspensePage,
});

function NestedSuspensePage() {
  const { successData, errorData } = Route.useLoaderData();

  return (
    <div>
      <Await promise={successData} fallback={<OuterLoading />}>
        {(recipe) => <SuccessDisplay recipe={recipe} />}
      </Await>
      <ErrorBoundary fallback={<ErrorDisplay />}>
        <Await promise={errorData} fallback={<NestedLoading />}>
          {(data) => <div>{JSON.stringify(data)}</div>}
        </Await>
      </ErrorBoundary>
    </div>
  );
}
```

### 6.9 Example: Form submission (`/recipes/new`)

**File: `apps/tanstack-start/src/routes/recipes/new.tsx`**

```tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getCategoriesAndIngredients } from "~/server-fns/recipes";
import { createRecipe } from "~/server-fns/mutations";

export const Route = createFileRoute("/recipes/new")({
  loader: () => getCategoriesAndIngredients(),
  component: NewRecipePage,
});

function NewRecipePage() {
  const { categories, ingredients } = Route.useLoaderData();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await createRecipe({
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        prepTime: parseInt(formData.get("prepTime") as string, 10),
        cookTime: parseInt(formData.get("cookTime") as string, 10),
        difficulty: formData.get("difficulty") as string,
        servings: parseInt(formData.get("servings") as string, 10),
        categoryId: formData.get("categoryId") as string,
        ingredients: [
          { ingredientId: "1", quantity: 2 },
          { ingredientId: "2", quantity: 1 },
        ],
      },
    });

    navigate({ to: "/recipes/$id", params: { id: result.id } });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Same form JSX as Next.js, but using onSubmit handler instead of form action */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ... form fields identical to Next.js version ... */}
      </form>
    </div>
  );
}
```

### 6.10 Client-side testing pages

Client-side pages (`/testing/client/broken-api` and `/testing/client/broken-mutation`) work identically in TanStack Start because they are pure React client components. No `"use client"` directive is needed -- TanStack Start components are universal by default.

**Key differences from Next.js version:**

- Replace `import Link from "next/link"` with `import { Link } from "@tanstack/react-router"`
- Replace `href` prop with `to` prop on `<Link>`
- For `/api/error/*` fetch calls: replace `/api/error/test` with the full Express URL via environment variable, OR proxy through the same HTTPS proxy. Since these are browser fetches through the proxy, the paths stay as `/api/error/test` (the proxy routes `/api` to Express).
- For the browser GraphQL client: use `@obs-playground/graphql-client/browser` import, same as Next.js

**File: `apps/tanstack-start/src/routes/testing/client/broken-api.tsx`**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

const apiResponseSchema = z.record(z.string(), z.unknown());

export const Route = createFileRoute("/testing/client/broken-api")({
  component: BrokenAPIPage,
});

function BrokenAPIPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ... identical logic to Next.js version
  // fetch("/api/error/test") -- works through the HTTPS proxy
}
```

### 6.11 Broken form (Server function that always fails)

**File: `apps/tanstack-start/src/routes/testing/forms/broken-create.tsx`**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { brokenCreateRecipe } from "~/server-fns/mutations";

export const Route = createFileRoute("/testing/forms/broken-create")({
  component: BrokenCreatePage,
});

function BrokenCreatePage() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // This will throw because the GraphQL mutation always errors
    await brokenCreateRecipe();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Same JSX as Next.js version */}
    </form>
  );
}
```

---

## Phase 7: Proxy and Script Integration

### 7.1 Update dev proxy

**File: `dev-proxy.ts`** -- Add TanStack Start route before the catch-all `/` routes in both `normalApp` and `customApp`:

```ts
// TanStack Start proxy - add before the catch-all "/" route
function setupTanstackRoute(app: Application): void {
  app.use(
    "/tanstack",
    createProxyMiddleware({
      target: "http://localhost:3100",
      changeOrigin: true,
      ws: true,
      // Do NOT rewrite paths -- TanStack Start expects /tanstack prefix
    }),
  );
}
```

Insert `setupTanstackRoute(normalApp)` and `setupTanstackRoute(customApp)` after `setupSharedRoutes()` but before the catch-all `"/"` proxy.

Update the console banner to include the TanStack Start URL.

### 7.2 Update dev script

**File: `scripts/dev.sh`** -- Add TanStack Start to concurrently:

```bash
npx concurrently \
  --names "OTEL,GQL-CLIENT,NEXT,CUSTOM,EXPRESS,GRAPHQL,TANSTACK,PROXY" \
  --prefix-colors "blue,white,cyan,red,magenta,yellow,gray,green" \
  "cd packages/otel && npm run dev" \
  "cd packages/graphql-client && npm run dev" \
  "$NEXTJS_NORMAL_CMD" \
  "$NEXTJS_CUSTOM_CMD" \
  "cd apps/express-server && ${DD_PREFIX}PORT=3001 npm run dev" \
  "cd apps/graphql-server && ${DD_PREFIX}PORT=4000 npm run dev" \
  "cd apps/tanstack-start && PORT=3100 npm run dev" \
  "tsx dev-proxy.ts"
```

### 7.3 Update start script

**File: `scripts/start.sh`** -- Add production start:

```bash
npx concurrently \
  --names "NEXT,CUSTOM,EXPRESS,GRAPHQL,TANSTACK,PROXY" \
  --prefix-colors "cyan,red,magenta,yellow,gray,green" \
  "cd apps/nextjs-app && PORT=3000 npm run start" \
  "cd apps/nextjs-app && CUSTOM_SERVER=true NODE_ENV=production PORT=3002 tsx server.ts" \
  "cd apps/express-server && PORT=3001 node --env-file=../../.env dist/index.js" \
  "cd apps/graphql-server && PORT=4000 node --env-file=../../.env dist/index.js" \
  "cd apps/tanstack-start && PORT=3100 npm run start" \
  "tsx dev-proxy.ts"
```

### 7.4 Update `.env.example`

Add TanStack-specific vars:

```
# TanStack Start
VITE_SENTRY_DSN=https://your_sentry_key@oYOUR_ORG_ID.ingest.us.sentry.io/YOUR_TANSTACK_PROJECT_ID
```

---

## Phase 8: Complete File Inventory

### New files to create

```
apps/tanstack-start/
  package.json
  tsconfig.json
  vite.config.ts
  .env.local
  .gitignore
  src/
    client.tsx
    ssr.tsx
    server.ts
    router.tsx
    otel.ts
    global-middleware.ts
    instrument.server.mjs          (if using --import for Sentry)
    routeTree.gen.ts               (auto-generated by TanStack router plugin)
    components/
      DefaultCatchBoundary.tsx
      NotFound.tsx
    server-fns/
      recipes.ts
      categories.ts
      shopping-list.ts
      meal-planner.ts
      nutrition.ts
      inventory.ts
      mutations.ts
    routes/
      __root.tsx
      index.tsx
      categories/
        $slug.tsx
      recipes/
        $id/
          index.tsx
          with-cost.tsx
          nutrition.tsx
          full.tsx
        compare.tsx
        new.tsx
      shopping-list/
        index.tsx
      meal-planner/
        index.tsx
      batch-nutrition/
        index.tsx
      testing/
        errors/
          index.tsx
          500.tsx
          not-found.tsx
          express-error.tsx
          graphql-error.tsx
          timeout.tsx
          partial-failure.tsx
          suspense-error.tsx
          nested-suspense.tsx
        forms/
          broken-create.tsx
        client/
          broken-api.tsx
          broken-mutation.tsx
```

### Existing files to modify

| File                   | Change                                                  |
| ---------------------- | ------------------------------------------------------- |
| `tsconfig.json` (root) | Add `{ "path": "./apps/tanstack-start" }` to references |
| `turbo.json`           | Add `.output/**` to build outputs                       |
| `dev-proxy.ts`         | Add `/tanstack` proxy route to port 3100                |
| `scripts/dev.sh`       | Add tanstack-start to concurrently                      |
| `scripts/start.sh`     | Add tanstack-start production start                     |
| `.env.example`         | Add `VITE_SENTRY_DSN`                                   |

---

## Phase 9: Known Challenges and Mitigations

### 9.1 OTEL auto-instrumentation with Vite dev server

**Problem:** The `@opentelemetry/auto-instrumentations-node` package uses `require-in-the-middle` and `import-in-the-middle` to monkey-patch Node.js core modules (http, https, etc.). In Vite's dev mode, the dev server itself handles HTTP and module loading via ESM, which can interfere with these hooks.

**Mitigation:**

1. Start with OTEL initialization in `src/server.ts` (before handler import). This captures server-side fetch calls made by server functions.
2. If `http` auto-instrumentation doesn't capture incoming request spans in dev, add manual span creation in global middleware.
3. In production builds (Node.js server output), `--import` flag works reliably.

### 9.2 Base path `/tanstack`

**Problem:** Both Vite and TanStack Router need to know about the base path.

**Mitigation:**

- Set `base: "/tanstack"` in `vite.config.ts` for asset paths
- Set `basepath: "/tanstack"` in `router.tsx` for route matching
- Do NOT rewrite paths in the proxy -- TanStack Start receives requests with the `/tanstack` prefix intact

### 9.3 Client-side fetch paths for testing pages

**Problem:** The client-side testing pages (`broken-api`, `broken-mutation`) make fetch calls to `/api/error/*` and `/graphql`. These paths go through the browser to the HTTPS proxy, which routes them correctly. No change needed -- the proxy handles `/api` and `/graphql` regardless of which frontend app initiated the request.

### 9.4 Sentry alpha SDK limitations

**Problem:** `@sentry/tanstackstart-react` is in alpha. Server-side error capture depends on `--import` flag which doesn't work on all deployment targets.

**Mitigation:**

- For local development, the `--import` flag or `server.ts` initialization works
- Keep `tracesSampleRate: 0` to avoid conflict with OTEL
- Use Sentry only for error monitoring, not tracing
- The OTEL backends (Honeycomb, Grafana, etc.) handle all trace export

### 9.5 Shared packages as workspace dependencies

**Problem:** `@obs-playground/otel`, `@obs-playground/graphql-client`, and `@obs-playground/env` must be built before the TanStack Start app can use them.

**Mitigation:** The `turbo.json` already has `"dependsOn": ["^build"]` for the `build` task, and the dev script already runs `cd packages/otel && npm run dev` and `cd packages/graphql-client && npm run dev` in parallel. The packages compile TypeScript to `dist/` and TanStack Start's Vite resolves them through workspace `node_modules` symlinks. No additional setup needed.

### 9.6 `graphqlRequest` used in server functions

The server-side `graphqlRequest` from `@obs-playground/graphql-client` uses `getGraphqlUrl()` which reads `GRAPHQL_BASE_URL` from `process.env`. In TanStack Start server functions, `process.env` is available. The `.env.local` file must set `GRAPHQL_BASE_URL=http://localhost:4000`. Root `.env` loading needs to be ensured -- use `--env-file=../../.env` in dev script or Vite's `envDir` option.

---

## Phase 10: Verification Steps

### 10.1 Smoke test (after Phase 4)

1. Run `npm install` from root
2. Run `npm run dev -w tanstack-start`
3. Visit `http://localhost:3100/tanstack` -- should see root layout
4. Verify `routeTree.gen.ts` is generated

### 10.2 OTEL verification (after Phase 2)

1. Set `OTEL_EXPORTER_CONSOLE=true` in `.env`
2. Run the dev server
3. Visit a page -- check console for span output
4. Verify spans have `service.name: "tanstack-start-app"`
5. Verify server function calls produce child spans

### 10.3 Page functionality (after Phase 6, per page)

For each page, verify:

1. Page loads without errors
2. Data fetching works (check GraphQL/Express calls succeed)
3. Links navigate correctly between pages
4. Search params are parsed (for `/recipes/compare`, `/shopping-list`, etc.)
5. Error pages throw as expected (check error boundary renders)
6. Client-side testing pages make fetch calls correctly

### 10.4 Proxy verification (after Phase 7)

1. Run `npm run dev:all`
2. Visit `https://localhost/tanstack` -- TanStack Start app loads
3. Visit `https://localhost/tanstack/recipes/1` -- recipe detail loads
4. Visit `https://localhost/api/ingredients/prices?ids=1,2` -- Express still works
5. Visit `https://localhost/graphql` -- GraphQL still works
6. Visit `https://localhost/` -- Next.js still works

### 10.5 Full trace verification

1. Configure Honeycomb (or another backend) credentials
2. Visit `https://localhost/tanstack/recipes/1/full`
3. Check the trace backend for a trace spanning: TanStack Start -> GraphQL -> Express
4. Verify the trace has the `tanstack-start-app` service name
5. Verify span attributes like `recipe.id`, `server_fn.name` are present

### 10.6 Build verification

1. Run `npm run build` from root (turbo builds all)
2. Verify `apps/tanstack-start/.output/` is produced
3. Run `npm run start:all`
4. Visit `https://localhost/tanstack` -- production build works

---

## Implementation Order Summary

| #         | Phase                           | Estimated Effort | Dependencies |
| --------- | ------------------------------- | ---------------- | ------------ |
| 1         | Scaffold + monorepo integration | 1-2 hours        | None         |
| 2         | OTEL integration                | 1 hour           | Phase 1      |
| 3         | Sentry integration              | 30 min           | Phase 1      |
| 4         | App shell + routing foundation  | 1-2 hours        | Phase 1      |
| 5         | Server functions                | 2-3 hours        | Phase 2, 4   |
| 6         | All 23 routes                   | 4-6 hours        | Phase 5      |
| 7         | Proxy + scripts                 | 30 min           | Phase 1      |
| 8         | Verification                    | 1-2 hours        | All phases   |
| **Total** |                                 | **~12-16 hours** |              |

Phases 2, 3, and 4 can be worked on in parallel once Phase 1 is complete. Phase 5 should be done before Phase 6. Phase 7 can be done any time after Phase 1.
