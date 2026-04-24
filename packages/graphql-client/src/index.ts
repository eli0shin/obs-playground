import { trace, SpanStatusCode } from "@opentelemetry/api";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { getGraphqlUrl } from "@obs-playground/env";
import { print } from "graphql";
import { z } from "zod";

export * from "./generated/graphql.js";

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

function getQueryText(document: TypedDocumentNode<unknown, unknown> | string) {
  return typeof document === "string" ? document : print(document);
}

export function graphqlRequest<TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  variables?: TVariables,
): Promise<TResult>;
export function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T>;

/**
 * GraphQL client that handles errors and OTEL instrumentation.
 *
 * Prefer passing generated typed documents from
 * @obs-playground/graphql-client/documents.
 */
export async function graphqlRequest<T>(
  document: TypedDocumentNode<unknown, unknown> | string,
  variables?: unknown,
): Promise<T> {
  const activeSpan = trace.getActiveSpan();
  const graphqlUrl = getGraphqlUrl();
  const query = getQueryText(document);

  try {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      const responseSnippet = responseText
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 200);
      const responseDetails = responseSnippet ? ` - ${responseSnippet}` : "";

      throw new Error(
        `GraphQL request failed: ${response.status} (${graphqlUrl})${responseDetails}`,
      );
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
