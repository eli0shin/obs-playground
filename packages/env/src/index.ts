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

export function getPublicGraphqlUrl(): string {
  const base =
    import.meta.env?.VITE_GRAPHQL_BASE_URL ??
    process.env.NEXT_PUBLIC_GRAPHQL_BASE_URL;

  if (!base) {
    throw new Error(
      "VITE_GRAPHQL_BASE_URL or NEXT_PUBLIC_GRAPHQL_BASE_URL environment variable is required",
    );
  }

  return `${normalizeBaseUrl(base)}/graphql`;
}
