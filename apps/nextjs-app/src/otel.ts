import { initializeOtel } from "@obs-playground/otel";

export const { logger } = initializeOtel({
  serviceName: process.env.CUSTOM_SERVER
    ? "nextjs-custom-server"
    : "nextjs-app",
  instrumentations: {
    "@opentelemetry/instrumentation-http": {
      enabled: false,
    },
    "@opentelemetry/instrumentation-undici": {
      enabled: false,
    },
  },
});
