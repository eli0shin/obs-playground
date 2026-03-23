import { trace, SpanStatusCode } from "@opentelemetry/api";
import { getGraphqlUrl } from "@obs-playground/env";
import { z } from "zod";

export type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

const graphqlResponseSchema = z.object({
  data: z.unknown().optional(),
  errors: z
    .array(
      z.object({
        message: z.string(),
      }),
    )
    .optional(),
});

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

    const json: unknown = await response.json();
    const parsed = graphqlResponseSchema.parse(json);
    const data = parsed.data as T | undefined;
    const errors = parsed.errors;

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
