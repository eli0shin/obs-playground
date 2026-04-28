type RuntimeEnv = {
  GRAPHQL_BASE_URL?: string;
  EXPRESS_BASE_URL?: string;
};

declare global {
  var __ENV: RuntimeEnv | undefined;
}

function normalizeBaseUrl(base: string): string {
  const trimmedBase = base.trim().replace(/\/+$/, "");

  if (/^https?:\/\//.test(trimmedBase)) {
    return trimmedBase;
  }

  return `http://${trimmedBase}`;
}

const PREVIEW_SERVICE_MAP = {
  GRAPHQL_BASE_URL: "obs-graphql",
  EXPRESS_BASE_URL: "obs-express",
} satisfies Record<keyof RuntimeEnv, string>;

function getPreviewUrl(key: keyof RuntimeEnv): string | undefined {
  const externalUrl = process.env.RENDER_EXTERNAL_URL;
  if (!externalUrl) return undefined;
  const previewSuffix =
    externalUrl.match(/-pr-\d+(?=\.onrender\.com)/)?.[0] ?? "";
  return `https://${PREVIEW_SERVICE_MAP[key]}${previewSuffix}.onrender.com`;
}

function getEnv(key: keyof RuntimeEnv): string | undefined {
  if (globalThis.__ENV?.[key] !== undefined) return globalThis.__ENV[key];
  if (typeof process === "undefined") return undefined;
  if (process.env.IS_PULL_REQUEST === "true") {
    return getPreviewUrl(key) ?? process.env[key];
  }
  return process.env[key];
}

export function getRuntimeEnv(): RuntimeEnv {
  return {
    GRAPHQL_BASE_URL: getEnv("GRAPHQL_BASE_URL"),
    EXPRESS_BASE_URL: getEnv("EXPRESS_BASE_URL"),
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
