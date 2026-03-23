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
  return response.json() as Promise<{ data: T; errors?: unknown[] }>;
}
