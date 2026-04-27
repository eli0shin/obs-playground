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
} satisfies NextConfig;

export default nextConfig;
