import { initializeOtel } from "@obs-playground/otel";

export const { logger } = initializeOtel({
  serviceName: "tanstack-start-app",
  instrumentations: {
    "@opentelemetry/instrumentation-http": {
      ignoreIncomingRequestHook: (request) => {
        const url = request.url ?? "";
        return (
          url.startsWith("/@") ||
          url.startsWith("/__") ||
          url.startsWith("/node_modules/")
        );
      },
    },
  },
});
