import { initializeOtel } from "@obs-playground/otel";

initializeOtel({
  serviceName: "tanstack-start-app",
  instrumentations: {},
});
