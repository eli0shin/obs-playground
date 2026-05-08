import type { Span } from "@opentelemetry/api";

export function recordExceptionWithCauses(
  span: Span | undefined,
  error: Error,
): void {
  span?.recordException(error);

  if (error.cause instanceof Error) {
    recordExceptionWithCauses(span, error.cause);
  }
}
