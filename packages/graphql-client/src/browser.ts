import { datadogRum } from "@datadog/browser-rum";
import { getPublicGraphqlUrl } from "@obs-playground/env";

export type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResponse<T>> {
  const response = await fetch(getPublicGraphqlUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const { data, errors } = (await response.json()) as GraphQLResponse<T>;

  if (errors && errors.length > 0) {
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
