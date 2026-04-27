import type { NextConfig } from "next";

const nextConfig = {
  distDir: process.env.CUSTOM_SERVER === "true" ? ".next-custom" : ".next",
  serverExternalPackages: [
    "@opentelemetry/api",
    "@opentelemetry/sdk-node",
    "@opentelemetry/instrumentation",
    "@opentelemetry/auto-instrumentations-node",
    "import-in-the-middle",
    "require-in-the-middle",
  ],
  async rewrites() {
    const graphqlBaseUrl = process.env.GRAPHQL_BASE_URL?.replace(/\/+$/, "");
    if (!graphqlBaseUrl) return [];
    return [
      {
        source: "/graphql",
        destination: `${graphqlBaseUrl}/graphql`,
      },
    ];
  },
} satisfies NextConfig;

export default nextConfig;
