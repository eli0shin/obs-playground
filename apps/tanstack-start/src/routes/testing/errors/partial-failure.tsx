import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { graphqlRequest } from "@obs-playground/graphql-client";

const getPartialData = createServerFn({ method: "GET" }).handler(async () => {
  const results = await Promise.allSettled([
    graphqlRequest<{ recipe: { id: string; title: string } | null }>(
      `query { recipe(id: "1") { id title } }`,
    ),
    graphqlRequest<{ recipe: { id: string; title: string } | null }>(
      `query { recipe(id: "2") { id title } }`,
    ),
    graphqlRequest<{ errorQuery: string }>(`query { errorQuery }`),
    fetch("http://localhost:3001/error/test").then((r) => {
      if (!r.ok) throw new Error(`Express error: ${r.status}`);
      return r.json();
    }),
  ]);
  return results.map((r) =>
    r.status === "fulfilled"
      ? { status: "fulfilled" as const, value: JSON.stringify(r.value) }
      : { status: "rejected" as const, reason: String(r.reason) },
  );
});

export const Route = createFileRoute("/testing/errors/partial-failure")({
  loader: getPartialData,
  component: PartialFailurePage,
});

function PartialFailurePage() {
  const results = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          to="/testing/errors"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to error tests
        </Link>
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Partial Failure Test
        </h1>
        <div className="space-y-4">
          {results.map((result, resultIndex) => (
            <div
              key={`${result.status}-${result.status === "fulfilled" ? result.value : result.reason}`}
              className={`rounded-lg border p-4 ${result.status === "fulfilled" ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"}`}
            >
              <p
                className={`font-medium ${result.status === "fulfilled" ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"}`}
              >
                Request {resultIndex + 1}: {result.status}
              </p>
              <p
                className={`mt-1 text-sm ${result.status === "fulfilled" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}
              >
                {result.status === "fulfilled" ? result.value : result.reason}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
