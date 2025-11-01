import { GRAPHQL_URL } from "@/config";

export const dynamic = "force-dynamic";

async function callFailingGraphQLQuery() {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query ErrorQuery {
          errorQuery
        }
      `,
    }),
    cache: "no-store",
  });

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(`GraphQL Error: ${result.errors[0].message}`);
  }

  return result.data;
}

export default async function GraphQLErrorPage() {
  await callFailingGraphQLQuery();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            This page should never render
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            If you see this, something went wrong with the GraphQL error test
          </p>
        </article>
      </div>
    </div>
  );
}
