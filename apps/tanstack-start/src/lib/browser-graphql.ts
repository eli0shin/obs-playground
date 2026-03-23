import { z } from "zod";

const graphqlResponseSchema = z.object({
  data: z.unknown(),
  errors: z.array(z.unknown()).optional(),
});

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data: T; errors?: unknown[] }> {
  const url = `${import.meta.env.VITE_GRAPHQL_BASE_URL}/graphql`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const text = await response.text();
  const { data, errors } = graphqlResponseSchema.parse(JSON.parse(text));
  return { data: data satisfies unknown, errors } satisfies {
    data: unknown;
    errors?: unknown[];
  };
}
