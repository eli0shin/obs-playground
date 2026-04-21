import { datadogRum } from "@datadog/browser-rum";
import type {
  ResultOf,
  TypedDocumentNode,
  VariablesOf,
} from "@graphql-typed-document-node/core";
import { getPublicGraphqlUrl } from "@obs-playground/env";
import { print } from "graphql";

export type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

function getQueryText(document: TypedDocumentNode<any, any> | string) {
  return typeof document === "string" ? document : print(document);
}

export function graphqlRequest<TDocument extends TypedDocumentNode<any, any>>(
  document: TDocument,
  variables?: VariablesOf<TDocument>,
): Promise<GraphQLResponse<ResultOf<TDocument>>>;
export function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResponse<T>>;

export async function graphqlRequest<T>(
  document: TypedDocumentNode<any, any> | string,
  variables?: unknown,
): Promise<GraphQLResponse<T>> {
  const query = getQueryText(document);
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
