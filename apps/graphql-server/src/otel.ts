import { SpanStatusCode } from "@opentelemetry/api";
import type { Span } from "@opentelemetry/api";
import { initializeOtel } from "@obs-playground/otel";

initializeOtel({
  serviceName: "graphql-server",
  instrumentations: {
    "@opentelemetry/instrumentation-graphql": {
      ignoreTrivialResolveSpans: true,
      depth: 1,
      responseHook: (span: Span, data: { errors?: readonly Error[] }) => {
        if (data.errors && data.errors.length > 0) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: data.errors[0].message,
          });
          for (const error of data.errors) {
            span.recordException(error);
          }
        }
      },
    },
  },
});
