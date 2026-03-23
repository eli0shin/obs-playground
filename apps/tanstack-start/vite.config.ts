import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  base: "/tanstack/",
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    nitro({
      rollupConfig: {
        external: [
          /^@opentelemetry\//,
          /^@obs-playground\//,
          "import-in-the-middle",
          "require-in-the-middle",
          "dd-trace",
        ],
      },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  ssr: {
    external: [
      "@opentelemetry/api",
      "@opentelemetry/sdk-node",
      "@opentelemetry/instrumentation",
      "@opentelemetry/auto-instrumentations-node",
      "@obs-playground/otel",
      "@obs-playground/graphql-client",
      "@obs-playground/env",
      "import-in-the-middle",
      "require-in-the-middle",
      "dd-trace",
    ],
  },
});
