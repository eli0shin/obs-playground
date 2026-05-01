import type { NextConfig } from "next";

function hostnameFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const allowedDevOrigins = [
  hostnameFromUrl(process.env.BASE_URL),
  hostnameFromUrl(process.env.CUSTOM_URL),
].filter((value): value is string => value !== null);

const nextConfig = {
  distDir: process.env.CUSTOM_SERVER === "true" ? ".next-custom" : ".next",
  allowedDevOrigins,
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
