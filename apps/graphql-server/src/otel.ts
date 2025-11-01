import { SpanStatusCode } from "@opentelemetry/api";
import type { Span } from "@opentelemetry/api";
import { initializeOtel } from "@obs-playground/otel";
import { GraphQLError } from "graphql";
import { nestedObjectToDotNotatedPaths } from "./utils/nested-object-to-dot-notated-paths.js";

initializeOtel({
  serviceName: "graphql-server",
  instrumentations: {
    "@opentelemetry/instrumentation-graphql": {
      ignoreTrivialResolveSpans: true,
      depth: 1,
      responseHook: (
        span: Span,
        data: { errors?: readonly GraphQLError[] },
      ) => {
        if (data.errors && data.errors.length > 0) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: data.errors[0].message,
          });
          span.setAttributes({
            "graphql.error.count": data.errors.length,
            "error.type": data.errors[0].name,
            "error.message": data.errors[0].message,
            "error.stack": data.errors[0].stack,
          });
          for (const error of data.errors) {
            const flattenedExtensions = nestedObjectToDotNotatedPaths(
              error.extensions as Record<string, unknown>,
              "graphql.error",
            );

            span.addEvent("graphql.error", {
              "graphql.error.message": error.message,
              "graphql.error.path": error.path as string[],
              "graphql.error.stacktrace": error.stack,
              ...flattenedExtensions,
            });

            if (
              error.originalError &&
              error.originalError.message !== error.message
            ) {
              span.recordException(error.originalError);
            }
            if (error.originalError?.cause) {
              span.recordException(error.originalError.cause as Error);
            }
          }
        }
      },
    },
  },
});
