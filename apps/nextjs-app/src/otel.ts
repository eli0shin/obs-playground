import { initializeOtel } from "@obs-playground/otel";

export const { logger } = initializeOtel({
  serviceName: process.env.CUSTOM_SERVER
    ? "nextjs-custom-server"
    : "nextjs-app",
  instrumentations: {
    "@opentelemetry/instrumentation-http": {
      ignoreIncomingRequestHook: (request) => {
        // Ignore all Next.js internal routes (paths starting with /_)
        const url = request.url ?? "";
        return url.startsWith("/_") || url.startsWith("/favicon");
      },
    },
  },
});
