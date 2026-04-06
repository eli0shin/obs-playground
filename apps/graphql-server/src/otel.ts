import { SpanStatusCode } from "@opentelemetry/api";
import type { Span } from "@opentelemetry/api";
import { initializeOtel } from "@obs-playground/otel";
import type { GraphQLError } from "graphql";
import { nestedObjectToDotNotatedPaths } from "./utils/nested-object-to-dot-notated-paths.js";

function getErrorCode(error: GraphQLError): string | undefined {
  const code = error.extensions.code;
  return typeof code === "string" ? code : undefined;
}

function getErrorPath(error: GraphQLError): string[] {
  if (!Array.isArray(error.path)) return [];
  return error.path.filter((p): p is string => typeof p === "string");
}

function getExtensions(error: GraphQLError): Record<string, unknown> {
  return error.extensions;
}

export const { logger } = initializeOtel({
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
          const firstError = data.errors[0];
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: firstError.message,
          });
          span.setAttributes({
            "graphql.error.count": data.errors.length,
            "graphql.error.messages": data.errors.map((e) => e.message),
            "graphql.error.codes": data.errors.map(getErrorCode),
            "error.type": firstError.name,
            "error.message": firstError.message,
            "error.stack": firstError.stack,
          });
          for (const error of data.errors) {
            const flattenedExtensions = nestedObjectToDotNotatedPaths(
              getExtensions(error),
              "graphql.error",
            );

            span.addEvent("graphql.error", {
              "graphql.error.message": error.message,
              "graphql.error.path": getErrorPath(error),
              "graphql.error.stacktrace": error.stack,
              ...flattenedExtensions,
            });

            if (
              error.originalError &&
              error.originalError.message !== error.message
            ) {
              span.recordException(error.originalError);
            }
            const cause = error.originalError?.cause;
            if (cause instanceof Error) {
              span.recordException(cause);
            }
          }
        }
      },
    },
  },
});
