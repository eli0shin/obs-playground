import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getExpressUrl, getGraphqlUrl, getRuntimeEnv } from "./index.js";

const ENV_KEYS = [
  "EXPRESS_BASE_URL",
  "GRAPHQL_BASE_URL",
  "IS_PULL_REQUEST",
  "PUBLIC_EXPRESS_BASE_URL",
  "PUBLIC_GRAPHQL_BASE_URL",
  "RENDER_EXTERNAL_URL",
] as const;

beforeEach(() => {
  globalThis.__ENV = undefined;
  for (const key of ENV_KEYS) vi.stubEnv(key, undefined);
});

afterEach(() => {
  globalThis.__ENV = undefined;
  vi.unstubAllEnvs();
});

describe("runtime environment URLs", () => {
  it("injects public URLs while server URL helpers retain internal URLs", () => {
    vi.stubEnv("GRAPHQL_BASE_URL", "http://graphql:4000");
    vi.stubEnv("EXPRESS_BASE_URL", "http://express:3001");
    vi.stubEnv("PUBLIC_GRAPHQL_BASE_URL", "https://graphql.example.test");
    vi.stubEnv("PUBLIC_EXPRESS_BASE_URL", "https://express.example.test");

    expect(getRuntimeEnv()).toEqual({
      GRAPHQL_BASE_URL: "https://graphql.example.test",
      EXPRESS_BASE_URL: "https://express.example.test",
    });
    expect(getGraphqlUrl()).toBe("http://graphql:4000/graphql");
    expect(getExpressUrl()).toBe("http://express:3001");
  });

  it("falls back to server URLs when public URLs are not configured", () => {
    vi.stubEnv("GRAPHQL_BASE_URL", "http://graphql:4000");
    vi.stubEnv("EXPRESS_BASE_URL", "http://express:3001");

    expect(getRuntimeEnv()).toEqual({
      GRAPHQL_BASE_URL: "http://graphql:4000",
      EXPRESS_BASE_URL: "http://express:3001",
    });
  });

  it("preserves Render pull request URL derivation", () => {
    vi.stubEnv("IS_PULL_REQUEST", "true");
    vi.stubEnv("RENDER_EXTERNAL_URL", "https://obs-nextjs-pr-42.onrender.com");

    expect(getRuntimeEnv()).toEqual({
      GRAPHQL_BASE_URL: "https://obs-graphql-pr-42.onrender.com",
      EXPRESS_BASE_URL: "https://obs-express-pr-42.onrender.com",
    });
    expect(getGraphqlUrl()).toBe(
      "https://obs-graphql-pr-42.onrender.com/graphql",
    );
    expect(getExpressUrl()).toBe("https://obs-express-pr-42.onrender.com");
  });
});
