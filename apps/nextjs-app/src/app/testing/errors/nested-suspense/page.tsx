import { Suspense } from "react";
import Link from "next/link";
import { GRAPHQL_URL } from "@/config";

export const dynamic = "force-dynamic";

async function SuccessComponent() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query { recipe(id: "1") { id title } }`,
    }),
    cache: "no-store",
  });

  const result = await response.json();

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
      <h3 className="font-medium text-green-900 dark:text-green-100">
        Success Component (Loaded)
      </h3>
      <p className="mt-1 text-sm text-green-700 dark:text-green-300">
        Recipe: {result.data.recipe.title}
      </p>
    </div>
  );
}

async function ErrorComponent(): Promise<null> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  throw new Error("Nested Suspense component failed after 1.5s delay");
}

function OuterLoadingFallback() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
      <div className="flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="ml-3 text-blue-800 dark:text-blue-200">
          Loading outer component...
        </span>
      </div>
    </div>
  );
}

function NestedLoadingFallback() {
  return (
    <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
      <div className="flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        <span className="ml-3 text-sm text-purple-800 dark:text-purple-200">
          Loading nested component...
        </span>
      </div>
    </div>
  );
}

export default function NestedSuspensePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/testing/errors"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to error testing
        </Link>

        <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Nested Suspense Error:</strong> Outer component succeeds
            after 1s, nested component errors after 1.5s
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Nested Suspense Error Test
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            This page has nested Suspense boundaries. The outer one succeeds,
            but the nested one fails.
          </p>

          <div className="mt-8">
            <Suspense fallback={<OuterLoadingFallback />}>
              <SuccessComponent />
              <Suspense fallback={<NestedLoadingFallback />}>
                <ErrorComponent />
              </Suspense>
            </Suspense>
          </div>

          <div className="mt-8 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
              What this tests
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              <li>Nested Suspense boundary behavior</li>
              <li>Partial success with nested failures</li>
              <li>Error isolation between Suspense boundaries</li>
              <li>Span hierarchies for nested async components</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
