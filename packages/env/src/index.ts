type RuntimeEnv = {
  GRAPHQL_BASE_URL?: string;
  EXPRESS_BASE_URL?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __ENV: RuntimeEnv | undefined;
}

function normalizeBaseUrl(base: string): string {
  const trimmedBase = base.trim().replace(/\/+$/, "");

  if (/^https?:\/\//.test(trimmedBase)) {
    return trimmedBase;
  }

  return `http://${trimmedBase}`;
}

function getEnv(key: keyof RuntimeEnv): string | undefined {
  if (globalThis.__ENV?.[key]) return globalThis.__ENV[key];
  return typeof process !== "undefined" ? process.env[key] : undefined;
}

export function getRuntimeEnv(): RuntimeEnv {
  return {
    GRAPHQL_BASE_URL: process.env.GRAPHQL_BASE_URL,
    EXPRESS_BASE_URL: process.env.EXPRESS_BASE_URL,
  };
}

export function getGraphqlUrl(): string {
  const base = getEnv("GRAPHQL_BASE_URL");
  if (!base) {
    throw new Error("GRAPHQL_BASE_URL environment variable is required");
  }

  return `${normalizeBaseUrl(base)}/graphql`;
}

export function getExpressUrl(): string {
  const base = getEnv("EXPRESS_BASE_URL");
  if (!base) {
    throw new Error("EXPRESS_BASE_URL environment variable is required");
  }

  return normalizeBaseUrl(base);
}
