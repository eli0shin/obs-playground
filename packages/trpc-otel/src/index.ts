import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { recordExceptionWithCauses } from "@obs-playground/otel";
import type { TRPCMiddlewareFunction } from "@trpc/server";
import { flatten } from "flat";

type TracingOptions = {
  collectInput?: boolean;
};

type EmptyContext = Record<string, never>;

type TracingMiddleware = <
  TContext = unknown,
  TMeta = unknown,
  TContextOverrides = EmptyContext,
  TInputOut = unknown,
>(
  opts: Parameters<
    TRPCMiddlewareFunction<
      TContext,
      TMeta,
      TContextOverrides,
      TContextOverrides,
      TInputOut
    >
  >[0],
) => ReturnType<
  TRPCMiddlewareFunction<
    TContext,
    TMeta,
    TContextOverrides,
    TContextOverrides,
    TInputOut
  >
>;

/**
 * @param options
 * @param options.collectInput - Whether or not to collect the input of the request. Defaults to false.
 *
 * @returns
 */
export function tracing(options: TracingOptions = {}): TracingMiddleware {
  const tracer = trace.getTracer("@obs-playground/trpc-otel");
  return async (opts) => {
    return tracer.startActiveSpan(
      `${opts.type} ${opts.path}`,
      {
        attributes: {
          "trpc.path": opts.path,
          "trpc.type": opts.type,
          "http.route": opts.path,
        },
        kind: SpanKind.SERVER,
      },
      async (span) => {
        try {
          const result = await opts.next();

          if (options.collectInput) {
            const rawInput = await opts.getRawInput();
            if (rawInput !== null && typeof rawInput === "object") {
              span.setAttributes(flatten({ input: rawInput }));
            }
          }

          if (!result.ok) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: result.error.message,
            });
            recordExceptionWithCauses(span, result.error);
          }

          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : undefined,
          });
          if (error instanceof Error) {
            recordExceptionWithCauses(span, error);
          }
          throw error;
        } finally {
          span.end();
        }
      },
    );
  };
}

export type { TracingOptions };
