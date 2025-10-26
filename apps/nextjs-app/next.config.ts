import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@opentelemetry/api", "@opentelemetry/sdk-node"],
  /* config options here */
};

export default nextConfig;
