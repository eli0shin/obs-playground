import { Suspense } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function ComponentThatErrorsAfterDelay(): Promise<null> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  throw new Error(
    "Suspense component failed after streaming started (2s delay)",
  );
}

function LoadingFallback() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 dark:border-blue-800 dark:bg-blue-950">
      <div className="flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="ml-3 text-blue-800 dark:text-blue-200">
          Loading component...
        </span>
      </div>
    </div>
  );
}

export default function SuspenseErrorPage() {
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
            <strong>Suspense Streaming Error:</strong> This page uses Suspense
            to stream content, but the component will error after 2 seconds
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Suspense Error Test
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            The component below will show a loading state, then error after 2
            seconds
          </p>

          <div className="mt-8">
            <Suspense fallback={<LoadingFallback />}>
              <ComponentThatErrorsAfterDelay />
            </Suspense>
          </div>

          <div className="mt-8 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
              What this tests
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              <li>Suspense boundary behavior during streaming</li>
              <li>Error handling after streaming has started</li>
              <li>Span recording for errors in async components</li>
              <li>Error boundary interaction with Suspense</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
