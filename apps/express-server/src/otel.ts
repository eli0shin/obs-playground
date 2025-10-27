import { initializeOtel } from "@obs-playground/otel";
import { ExpressLayerType } from "@opentelemetry/instrumentation-express";

initializeOtel({
  serviceName: "express-server",
  instrumentations: {
    "@opentelemetry/instrumentation-express": {
      ignoreLayersType: [ExpressLayerType.ROUTER],
    },
  },
});
