import { context, createContextKey, type Span } from "@opentelemetry/api";

/**
 * Context key for storing the GraphQL operation-level (EXECUTE) span.
 *
 * This key is used to store the operation span in OpenTelemetry's context
 * propagation system, making it accessible from anywhere in the call stack
 * without manual parameter passing.
 *
 * IMPORTANT: This must use the exact same string as the instrumentation patch.
 * The string 'graphql.operation.span' is used in both places to create the same
 * symbol, allowing the instrumentation to store the span and this utility to retrieve it.
 */
const OPERATION_SPAN_KEY = createContextKey("graphql.operation.span");

function hasSpanMethods(
  value: object,
): value is { setAttribute: unknown; setAttributes: unknown; setStatus: unknown } {
  return (
    "setAttribute" in value &&
    "setAttributes" in value &&
    "setStatus" in value
  );
}

function isSpan(value: unknown): value is Span {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!hasSpanMethods(value)) {
    return false;
  }
  return typeof value.setAttribute === "function";
}

/**
 * Retrieves the operation-level (EXECUTE) span from OpenTelemetry context.
 *
 * Unlike traditional approaches that require passing GraphQL context through
 * function parameters, this retrieves the span from OTEL's automatic context
 * propagation system. The context is automatically maintained across async
 * boundaries via AsyncHooksContextManager.
 *
 * This allows resolvers and nested functions to access the operation span
 * without manually propagating context parameters.
 *
 * @returns The operation span, or undefined if not found
 *
 * @example
 * ```typescript
 * export const Query = {
 *   myQuery: (_: unknown, { id }: { id: string }) => {
 *     // No context parameter needed!
 *     const operationSpan = getOperationSpan();
 *     operationSpan?.setAttributes({
 *       'custom.operation.complexity': calculateComplexity(id)
 *     });
 *     return fetchData(id);
 *   }
 * }
 * ```
 */
export function getOperationSpan(): Span | undefined {
  const value = context.active().getValue(OPERATION_SPAN_KEY);
  return isSpan(value) ? value : undefined;
}
