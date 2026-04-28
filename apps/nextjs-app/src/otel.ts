import { initializeOtel } from "@obs-playground/otel";

process.env.NEXT_OTEL_FETCH_DISABLED = "1";

initializeOtel({
  serviceName: process.env.CUSTOM_SERVER
    ? "nextjs-custom-server"
    : "nextjs-app",
  instrumentations: {
    "@opentelemetry/instrumentation-http": {
      enabled: false,
    },
  },
});
