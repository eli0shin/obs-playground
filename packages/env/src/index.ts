function normalizeBaseUrl(base: string): string {
  const trimmedBase = base.trim().replace(/\/+$/, "");

  if (/^https?:\/\//.test(trimmedBase)) {
    return trimmedBase;
  }

  return `http://${trimmedBase}`;
}

export function getGraphqlUrl(): string {
  if (!process.env.GRAPHQL_BASE_URL) {
    throw new Error("GRAPHQL_BASE_URL environment variable is required");
  }

  return `${normalizeBaseUrl(process.env.GRAPHQL_BASE_URL)}/graphql`;
}

export function getExpressUrl(): string {
  if (!process.env.EXPRESS_BASE_URL) {
    throw new Error("EXPRESS_BASE_URL environment variable is required");
  }

  return normalizeBaseUrl(process.env.EXPRESS_BASE_URL);
}

// Resolves a client-exposed env var across framework boundaries:
//   - Vite (TanStack Start): VITE_ prefix, exposed on import.meta.env
//   - Next.js: NEXT_PUBLIC_ prefix, exposed on process.env
// Callers pass the full key including prefix (e.g. "VITE_GRAPHQL_BASE_URL").
// Vite is checked first; falls back to process.env for Next.js/Node.
function getPublicEnv(key: string): string | undefined {
  const viteVal = String(import.meta.env[key] ?? "");
  if (viteVal) return viteVal;

  return process.env[key];
}

export function getPublicGraphqlUrl(): string {
  const base =
    getPublicEnv("VITE_GRAPHQL_BASE_URL") ??
    getPublicEnv("NEXT_PUBLIC_GRAPHQL_BASE_URL");

  if (!base) {
    throw new Error(
      "VITE_GRAPHQL_BASE_URL or NEXT_PUBLIC_GRAPHQL_BASE_URL environment variable is required",
    );
  }

  return `${normalizeBaseUrl(base)}/graphql`;
}
