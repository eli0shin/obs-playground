export function getGraphqlUrl(): string {
  if (!process.env.GRAPHQL_BASE_URL) {
    throw new Error("GRAPHQL_BASE_URL environment variable is required");
  }
  return `${process.env.GRAPHQL_BASE_URL}/graphql`;
}

export function getExpressUrl(): string {
  if (!process.env.EXPRESS_BASE_URL) {
    throw new Error("EXPRESS_BASE_URL environment variable is required");
  }
  return process.env.EXPRESS_BASE_URL;
}

function getPublicEnv(key: string): string | undefined {
  // Vite exposes public env vars on import.meta.env
  // Node/Next.js uses process.env
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
  return `${base}/graphql`;
}
