import { datadogRum } from "@datadog/browser-rum";

const GRAPHQL_URL = process.env.GRAPHQL_URL || "https://localhost/graphql";

export type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

/**
 * Browser-specific GraphQL client with Datadog RUM error tracking.
 *
 * @param query - GraphQL query or mutation string
 * @param variables - Optional variables object
 * @returns Promise resolving to GraphQL response with data and errors
 * @throws Error only on HTTP failure
 *
 * Reports all GraphQL errors to Datadog RUM but still returns the response.
 * Caller is responsible for handling errors and partial data.
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResponse<T>> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const { data, errors } = (await response.json()) as GraphQLResponse<T>;

  if (errors && errors.length > 0) {
    // Report each error to Datadog RUM
    errors.forEach((err) => {
      datadogRum.addError(new Error(err.message), {
        "graphql.document": query,
        "graphql.variables": variables,
        "graphql.error": err,
      });
    });
  }

  return { data, errors };
}
