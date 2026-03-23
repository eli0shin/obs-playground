import { z } from "zod";

function graphqlResponseSchema<T>() {
  return z.object({
    data: z.custom<T>(),
    errors: z.array(z.unknown()).optional(),
  });
}

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
  const parsed = graphqlResponseSchema<T>().parse(JSON.parse(text));
  return { data: parsed.data, errors: parsed.errors };
}
