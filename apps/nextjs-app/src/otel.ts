import { initializeOtel } from "@obs-playground/otel";

export const { logger } = initializeOtel({
  serviceName: "nextjs-app",
  instrumentations: {
    "@opentelemetry/instrumentation-http": {
      ignoreIncomingRequestHook: (request) => {
        // Ignore all Next.js internal routes (paths starting with /_)
        const url = request.url ?? "";
        return url.startsWith("/_");
      },
    },
  },
});
