function normalizeBaseUrl(base: string): string {
  const trimmedBase = base.trim().replace(/\/+$/, "");

  if (/^https?:\/\//.test(trimmedBase)) {
    return trimmedBase;
  }

  return `http://${trimmedBase}`;
}

function getBrowserOrigin(): string | undefined {
  const browserGlobal = globalThis as typeof globalThis & {
    location?: {
      origin?: string;
    };
  };
  const browserOrigin = browserGlobal.location?.origin;

  return typeof browserOrigin === "string" ? browserOrigin : undefined;
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

function getViteGraphqlBaseUrl(): string | undefined {
  try {
    const viteGraphqlBaseUrl: unknown = import.meta.env.VITE_GRAPHQL_BASE_URL;

    return typeof viteGraphqlBaseUrl === "string"
      ? viteGraphqlBaseUrl
      : undefined;
  } catch {
    return undefined;
  }
}

export function getPublicGraphqlUrl(): string {
  const base =
    getViteGraphqlBaseUrl() ??
    process.env.NEXT_PUBLIC_GRAPHQL_BASE_URL ??
    getBrowserOrigin();

  if (!base) {
    throw new Error(
      "VITE_GRAPHQL_BASE_URL, NEXT_PUBLIC_GRAPHQL_BASE_URL, or a browser origin is required",
    );
  }

  return `${normalizeBaseUrl(base)}/graphql`;
}
