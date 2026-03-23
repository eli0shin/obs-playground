# PR Review Fixes — Implementation Plan

14 issues to fix across the TanStack Start app and supporting packages. Grouped by dependency order so each step can be implemented and verified independently.

---

## Phase 1: Independent Quick Fixes (no cross-file dependencies)

### 1. Fix `isSubmitting` never resets on error (`new.tsx`)

**File:** `apps/tanstack-start/src/routes/recipes/new.tsx`

**Problem:** `setIsSubmitting(true)` at line 21 is never reset. If `createRecipe()` or `navigate()` throws, the button stays disabled forever.

**Change:** Wrap the body of `handleSubmit` in try/catch/finally. Add an `error` state to show the user what went wrong.

```tsx
// Replace lines 17-42 with:
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);

  try {
    const formData = new FormData(e.currentTarget);

    const input = {
      recipe: {
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        prepTime: Number(formData.get("prepTime")),
        cookTime: Number(formData.get("cookTime")),
        difficulty: String(formData.get("difficulty") ?? ""),
        servings: Number(formData.get("servings")),
        categoryId: String(formData.get("categoryId") ?? ""),
      },
      ingredients: z
        .array(z.object({ ingredientId: z.string(), quantity: z.number() }))
        .parse(JSON.parse(String(formData.get("ingredients") ?? "[]"))),
    } satisfies CreateRecipeInput;

    const result = await createRecipe({ data: input });
    await navigate({ to: "/recipes/$id", params: { id: result.id } });
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to create recipe");
  } finally {
    setIsSubmitting(false);
  }
};
```

Also add an error display element in the JSX, above or below the submit button area:

```tsx
{
  error && (
    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
      {error}
    </div>
  );
}
```

Insert this immediately before the `<div className="flex gap-4">` block (line 230).

---

### 2. Fix "Next.js" call chain labels → "TanStack Start"

**Files and exact replacements:**

| File                                   | Line | Old       | New              |
| -------------------------------------- | ---- | --------- | ---------------- |
| `src/routes/recipes/$id/nutrition.tsx` | 50   | `Next.js` | `TanStack Start` |
| `src/routes/recipes/$id/with-cost.tsx` | 43   | `Next.js` | `TanStack Start` |
| `src/routes/recipes/compare.tsx`       | 31   | `Next.js` | `TanStack Start` |
| `src/routes/recipes/$id/full.tsx`      | 93   | `Next.js` | `TanStack Start` |

Each is a single occurrence in a JSX string like:

```
<strong>Call Chain:</strong> Next.js &rarr; GraphQL &rarr; Express
```

Replace `Next.js` with `TanStack Start` in each.

---

### 3. Fix fragile `z.unknown()` error detection

**Files:** `batch-nutrition.ts`, `meal-planner.ts`, `shopping-list.ts`

**Problem:** `z.object({ error: z.unknown() })` matches ANY object with an `error` key — including valid success responses that happen to have an `error` field set to `null` or `undefined`. The current logic checks error _before_ success, so a false positive on error checking would cause a spurious throw.

**Fix:** Validate the success shape first, and only fall through to error checking if success parsing fails. Also tighten `z.unknown()` to `z.string()` since the Express error middleware always returns `{ error: string }`.

All three files follow the same pattern. Here is the change for `batch-nutrition.ts` (lines 21-23 and 48-58):

**Step A — Change the error schema (same in all three files):**

```ts
// Before:
const errorResponseSchema = z.object({
  error: z.unknown(),
});

// After:
const errorResponseSchema = z.object({
  error: z.string(),
});
```

**Step B — Reorder validation to check success first (all three files):**

```ts
// Before (batch-nutrition.ts lines 48-58):
const errorResult = errorResponseSchema.safeParse(json);
if (errorResult.success) {
  throw new Error(String(errorResult.data.error));
}

const result = batchNutritionResponseSchema.safeParse(json);
if (!result.success) {
  throw new Error("Invalid response format");
}

return result.data;

// After:
const result = batchNutritionResponseSchema.safeParse(json);
if (result.success) {
  return result.data;
}

const errorResult = errorResponseSchema.safeParse(json);
if (errorResult.success) {
  throw new Error(errorResult.data.error);
}

throw new Error("Invalid response format");
```

Apply the equivalent transformation to `meal-planner.ts` (lines 46-56) and `shopping-list.ts` (lines 53-63). In `shopping-list.ts`, preserve the span attributes that are set after the success parse — they should stay inside the `result.success` branch.

**shopping-list.ts specific:**

```ts
const result = shoppingListResponseSchema.safeParse(json);
if (result.success) {
  activeSpan?.setAttributes({
    "shopping_list.total_items": result.data.items.length,
    "shopping_list.total_cost": result.data.totalCost,
    "shopping_list.out_of_stock_count": result.data.outOfStock.length,
    "shopping_list.has_out_of_stock": result.data.outOfStock.length > 0,
  });

  return result.data;
}

const errorResult = errorResponseSchema.safeParse(json);
if (errorResult.success) {
  throw new Error(errorResult.data.error);
}

throw new Error("Invalid response format");
```

---

### 4. Fix `response.ok` checks in `recipe-details.ts`

**File:** `apps/tanstack-start/src/server-fns/recipe-details.ts`

**Problem:** Three helper functions (`getIngredientPrices`, `getIngredientNutrition`, `getIngredientStock`) call `response.json()` without checking `response.ok`. HTTP 500 errors are silently swallowed by Zod fallback defaults.

**Fix:** Add `response.ok` check with `activeSpan?.recordException()` before parsing. Each function needs the same pattern:

```ts
async function getIngredientPrices(
  ingredientIds: string[],
): Promise<Record<string, number>> {
  const activeSpan = trace.getActiveSpan();
  const response = await fetch(
    `${getExpressUrl()}/ingredients/prices?ids=${ingredientIds.join(",")}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    const err = new Error(
      `Failed to fetch ingredient prices: ${response.status}`,
    );
    activeSpan?.recordException(err);
    throw err;
  }
  const json: unknown = await response.json();
  const result = pricesSchema.safeParse(json);
  return result.success ? result.data : {};
}
```

Same pattern for `getIngredientNutrition` and `getIngredientStock`, with appropriate error messages:

- `"Failed to fetch ingredient nutrition: ${response.status}"`
- `"Failed to fetch ingredient stock: ${response.status}"`

Note: The `trace` import already exists at line 3. `getActiveSpan` is already used in the parent function. Just need to call it in each helper.

---

### 5. Remove Express `typeof` guards (dead code)

**Files and lines to remove:**

**`apps/express-server/src/routes/pricing.ts` lines 12-14:**

```ts
// Delete these 3 lines:
if (typeof id !== "string") {
  return res.status(400).json({ error: "Invalid ingredient ID" });
}
```

**`apps/express-server/src/routes/nutrition.ts` lines 11-13:**

```ts
// Delete these 3 lines:
if (typeof id !== "string") {
  return res.status(400).json({ error: "Invalid ingredient ID" });
}
```

**`apps/express-server/src/routes/inventory.ts` lines 11-13:**

```ts
// Delete these 3 lines:
if (typeof ingredientId !== "string") {
  return res.status(400).json({ error: "Invalid ingredient ID" });
}
```

Express route params are always strings — these checks are unreachable dead code.

---

### 6. Update `manifest.json`

**File:** `apps/tanstack-start/public/manifest.json`

```json
// Before:
"name": "Create TanStack App Sample"

// After:
"name": "OTEL Playground - TanStack Start"
```

This matches the project's naming pattern (observability playground).

---

### 7. Delete `docs/tanstack-start-plan.md`

```bash
git rm docs/tanstack-start-plan.md
```

1368 lines of planning notes — not appropriate for the repository.

---

## Phase 2: Config & Dependency Changes

### 8. Pin TanStack/nitro dependencies

**File:** `apps/tanstack-start/package.json`

**Source:** Versions resolved from `package-lock.json`:

- `@tanstack/react-router`: `1.168.2`
- `@tanstack/react-start`: `1.167.3`
- `nitro` (nitro-nightly): `3.0.1-20260322-095631-ffdd706a`

**Decision on version source:** Use the lockfile values. These are the versions already tested in CI. Using `npm view` would give a potentially untested newer version. The lockfile is the source of truth for what's been validated.

```json
// Before:
"@tanstack/react-router": "latest",
"@tanstack/react-start": "latest",
"nitro": "npm:nitro-nightly@latest",

// After:
"@tanstack/react-router": "^1.168.2",
"@tanstack/react-start": "^1.167.3",
"nitro": "npm:nitro-nightly@3.0.1-20260322-095631-ffdd706a",
```

Use `^` for TanStack packages (allows compatible updates), exact pin for nitro-nightly (nightly builds are inherently unstable; pinning prevents unexpected breakage).

Run `npm install` after this change to verify the lockfile stays consistent.

---

### 9. Remove `dd-trace` from `vite.config.ts` externals

**File:** `apps/tanstack-start/vite.config.ts`

**Problem:** TanStack Start doesn't use Datadog's native tracer (`dd-trace`). It was likely copied from a template or the Next.js config.

**Remove from two locations:**

Lines 19-20 (nitro rollupConfig external):

```ts
// Before:
external: [
  /^@opentelemetry\//,
  /^@obs-playground\//,
  "import-in-the-middle",
  "require-in-the-middle",
  "dd-trace",
],

// After:
external: [
  /^@opentelemetry\//,
  /^@obs-playground\//,
  "import-in-the-middle",
  "require-in-the-middle",
],
```

Lines 38-39 (ssr.external):

```ts
// Before:
"import-in-the-middle",
"require-in-the-middle",
"dd-trace",

// After:
"import-in-the-middle",
"require-in-the-middle",
```

---

### 10. Update `turbo.json` build outputs

**File:** `turbo.json` (root)

**Problem:** TanStack Start's Vite build outputs to `.output/**`, which isn't in the turbo cache outputs. This means turbo can't properly cache or restore TanStack Start builds.

```json
// Before:
"outputs": [".next/**", "!.next/cache/**", "dist/**"]

// After:
"outputs": [".next/**", "!.next/cache/**", "dist/**", ".output/**"]
```

---

### 11. Update `eslint-for-ai` version

**File:** `package.json` (root)

The monorepo currently specifies `"eslint-for-ai": "^1.0.8"` and has resolved version `1.0.12`, which is also the latest on npm. The installed version is already latest — the specifier `^1.0.8` permits `1.0.12`. No actual change is needed unless we want to bump the floor:

```json
// Before:
"eslint-for-ai": "^1.0.8",

// After:
"eslint-for-ai": "^1.0.12",
```

This just bumps the minimum to match what's already installed. Low-risk cosmetic change.

---

## Phase 3: Browser GraphQL Client Refactor

### 12. Replace `browser-graphql.ts` with shared client

**Design Decision — Evaluation of three options:**

**Option A: Refactor shared browser client to accept `baseUrl` parameter, make Datadog optional.**

- Pros: Single source of truth, all consumers benefit from improvements.
- Cons: Changes the existing API, requires updating the Next.js consumer. Datadog conditional import adds complexity.
- Effort: Medium.

**Option B: Add a Vite-compatible `getPublicGraphqlUrl` variant to `@obs-playground/env`.**

- Pros: Env package is the right home for URL resolution.
- Cons: Doesn't solve the Datadog import problem in the browser client. Would still need changes to the browser client.
- Effort: Medium (still need to address Datadog).

**Option C: Create a separate `browser-core` export without Datadog.**

- Pros: Zero impact on Next.js, clean separation, TanStack Start gets what it needs.
- Cons: Some code duplication between `browser.ts` and `browser-core.ts`.
- Effort: Low.

**Recommendation: Option A (refactor shared client).**

Rationale:

- The CLAUDE.md rule is explicit: "ALWAYS use the `graphqlRequest` function from `@obs-playground/graphql-client`."
- Option C creates a second browser client export, which is just the current local file promoted to a package — it doesn't consolidate.
- The Datadog import can be handled with a config parameter and dynamic import or a simple no-op guard.
- The env issue is cleanly solved by accepting `baseUrl` as a parameter.

**Implementation:**

**Step 1 — Refactor `packages/graphql-client/src/browser.ts`:**

```ts
type BrowserGraphQLConfig = {
  baseUrl: string;
  onError?: (
    error: Error,
    context: { query: string; variables?: Record<string, unknown> },
  ) => void;
};

export type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

let _config: BrowserGraphQLConfig | undefined;

export function configureBrowserGraphQL(config: BrowserGraphQLConfig): void {
  _config = config;
}

function getConfig(): BrowserGraphQLConfig {
  if (!_config) {
    throw new Error(
      "Browser GraphQL client not configured. Call configureBrowserGraphQL() first.",
    );
  }
  return _config;
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResponse<T>> {
  const config = getConfig();
  const response = await fetch(`${config.baseUrl}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const { data, errors } = (await response.json()) as GraphQLResponse<T>;

  if (errors && errors.length > 0) {
    errors.forEach((err) => {
      config.onError?.(new Error(err.message), { query, variables });
    });
  }

  return { data, errors };
}
```

**Step 2 — Update `packages/graphql-client/package.json`:**

Remove `@datadog/browser-rum` from dependencies (it moves to the Next.js app's devDependencies, or remains where it's already used).

```json
"dependencies": {
  "@obs-playground/env": "*",
  "@opentelemetry/api": "^1.9.0",
  "zod": "^4.2.1"
}
```

Note: `@obs-playground/env` is still needed for the server-side `index.ts` export. The browser export no longer imports it.

**Step 3 — Update Next.js consumer:**

**File:** `apps/nextjs-app/src/app/testing/client/broken-mutation/page.tsx`

The Next.js page currently imports `graphqlRequest` from `@obs-playground/graphql-client/browser`. It needs to call `configureBrowserGraphQL` before using the client. The cleanest approach is to configure it at the app level.

Create or update the Next.js app's client-side initialization to call:

```ts
import { configureBrowserGraphQL } from "@obs-playground/graphql-client/browser";
import { datadogRum } from "@datadog/browser-rum";

configureBrowserGraphQL({
  baseUrl: process.env.NEXT_PUBLIC_GRAPHQL_BASE_URL!,
  onError: (error, context) => {
    datadogRum.addError(error, {
      "graphql.document": context.query,
      "graphql.variables": context.variables,
    });
  },
});
```

This should be called once in a layout or a shared provider. We need to check where the Next.js app initializes client-side libraries to find the right place.

**Step 4 — Update TanStack Start consumer:**

**File:** `apps/tanstack-start/src/routes/testing/client/broken-mutation.tsx`

Change the import at line 3:

```ts
// Before:
import { graphqlRequest } from "../../../lib/browser-graphql";

// After:
import { graphqlRequest } from "@obs-playground/graphql-client/browser";
```

Configure the client somewhere that runs before this component. A reasonable location is a root client component or the `__root.tsx` route:

```ts
import { configureBrowserGraphQL } from "@obs-playground/graphql-client/browser";

configureBrowserGraphQL({
  baseUrl: import.meta.env.VITE_GRAPHQL_BASE_URL,
});
```

**Step 5 — Delete the local file:**

```bash
git rm apps/tanstack-start/src/lib/browser-graphql.ts
```

**Step 6 — Verify:** The `broken-mutation.tsx` usage pattern (`{ data, errors }` destructuring) matches the shared client's return type `GraphQLResponse<T>`, so no call-site changes are needed beyond the import.

---

## Phase 4: Observability Improvements

### 13. Add `recordException` in server function catch blocks

**Problem:** Server functions in TanStack Start throw errors but don't record them on the active OTEL span. The Express error middleware and the shared `graphqlRequest` both do this — TanStack server functions should match.

**Which server functions need changes?**

Looking at the codebase, the server functions that throw errors are:

- `batch-nutrition.ts` — throws on `!response.ok`, error response, or invalid format
- `meal-planner.ts` — same pattern
- `shopping-list.ts` — same pattern
- `recipe-details.ts` — will throw after the fix in issue #4 (helper functions)
- `mutations.ts` — `createRecipe` currently has no error handling at all (issue #1 handles the UI side; the server fn relies on `graphqlRequest` from the shared client which already records exceptions)
- `recipes.ts` — all use the shared `graphqlRequest` which already records exceptions

**Conclusion:** The three Express-calling server functions (`batch-nutrition.ts`, `meal-planner.ts`, `shopping-list.ts`) need `recordException` added. The GraphQL-calling ones already get it from the shared client.

**Pattern to apply (using `batch-nutrition.ts` as example):**

The handler already has `const activeSpan = trace.getActiveSpan()`. Wrap the fetch + parse logic in try/catch:

```ts
.handler(async ({ data: ids }): Promise<BatchNutritionResponse> => {
  const activeSpan = trace.getActiveSpan();
  const recipeIds = ids.split(",");

  activeSpan?.setAttributes({
    "batch_nutrition.recipe_count": recipeIds.length,
  });

  try {
    const response = await fetch(`${getExpressUrl()}/batch/nutrition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeIds }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to get batch nutrition: ${response.status}`);
    }

    const json: unknown = await response.json();

    const result = batchNutritionResponseSchema.safeParse(json);
    if (result.success) {
      return result.data;
    }

    const errorResult = errorResponseSchema.safeParse(json);
    if (errorResult.success) {
      throw new Error(errorResult.data.error);
    }

    throw new Error("Invalid response format");
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    activeSpan?.recordException(err);
    activeSpan?.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message,
    });
    throw err;
  }
});
```

This requires adding `SpanStatusCode` to the `@opentelemetry/api` import in each file:

```ts
import { trace, SpanStatusCode } from "@opentelemetry/api";
```

Apply the same pattern to `meal-planner.ts` and `shopping-list.ts`.

---

### 14. Comment or configure `instrumentations: {}` in `otel.ts`

**File:** `apps/tanstack-start/src/otel.ts`

**Decision: Add actual HTTP instrumentation configuration, not just a comment.**

Rationale:

- The Next.js app configures HTTP instrumentation to filter out internal routes (`/_next/*`).
- TanStack Start has analogous internal routes (Vite HMR, `/_build/*`, etc.) that should be filtered.
- An empty `{}` means auto-instrumentation uses defaults, which will capture all these noisy dev requests.
- A comment alone doesn't solve the noise problem.

**Change:**

```ts
// Before:
import { initializeOtel } from "@obs-playground/otel";

initializeOtel({
  serviceName: "tanstack-start-app",
  instrumentations: {},
});

// After:
import { initializeOtel } from "@obs-playground/otel";

initializeOtel({
  serviceName: "tanstack-start-app",
  instrumentations: {
    "@opentelemetry/instrumentation-http": {
      ignoreIncomingRequestHook: (request) => {
        const url = request.url ?? "";
        // Filter Vite dev server internal requests
        return url.startsWith("/@") || url.startsWith("/__");
      },
    },
  },
});
```

---

## Implementation Order

Recommended order to minimize conflicts and allow incremental verification:

1. **Issue 5** — Call chain labels (4 trivial string replacements)
2. **Issue 6** — manifest.json (trivial)
3. **Issue 7** — Delete plan doc (`git rm`)
4. **Issue 11** — Remove Express typeof guards (3 files, delete-only)
5. **Issue 9** — Remove dd-trace from vite.config.ts
6. **Issue 10** — turbo.json outputs
7. **Issue 8** — Pin dependencies + `npm install`
8. **Issue 11b** — Update eslint-for-ai version
9. **Issue 4** — Fix z.unknown() → z.string() + reorder validation (3 files)
10. **Issue 3** — Fix response.ok checks in recipe-details.ts
11. **Issue 13** — Add recordException to server functions (3 files)
12. **Issue 14** — Configure otel.ts instrumentations
13. **Issue 1** — Fix isSubmitting in new.tsx
14. **Issue 12** — Browser GraphQL client refactor (multi-file, cross-package)

Total files modified: ~18
Total files deleted: 2

---

## Verification Checklist

After all changes:

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes (run `npm run format` first)
- [ ] `npm run build` passes
- [ ] `npm run dev:all` starts all services without errors
- [ ] Manual test: create recipe form shows error on failure and re-enables submit button
- [ ] Manual test: broken-mutation test page works via shared browser client
- [ ] Manual test: call chain labels say "TanStack Start" not "Next.js"
