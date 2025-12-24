import { trace, SpanStatusCode } from "@opentelemetry/api";
import { getGraphqlUrl } from "@obs-playground/env";

export type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

/**
 * Minimal GraphQL client that handles errors and OTEL instrumentation.
 *
 * @param query - GraphQL query or mutation string
 * @param variables - Optional variables object
 * @returns Promise resolving to typed data
 * @throws Error on HTTP failure, GraphQL errors, or missing data
 *
 * Automatically records errors in the active OpenTelemetry span.
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const activeSpan = trace.getActiveSpan();

  try {
    const response = await fetch(getGraphqlUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const { data, errors } = (await response.json()) as GraphQLResponse<T>;

    if (errors && errors.length > 0) {
      throw new Error(`GraphQL error: ${errors[0].message}`);
    }

    if (!data) {
      throw new Error("GraphQL returned no data");
    }

    return data;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    activeSpan?.recordException(err);
    activeSpan?.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message,
    });
    throw err;
  }
}
