"use client";

import Link from "next/link";

export default function RecipesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <div className="flex items-center">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h1 className="ml-3 text-xl font-bold text-red-900 dark:text-red-100">
              Recipe Error
            </h1>
          </div>
          <p className="mt-2 text-sm text-red-800 dark:text-red-200">
            Something went wrong while processing your recipe request
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Unable to Process Recipe
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            An error occurred while loading or processing the recipe
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Error Message
              </h3>
              <p className="mt-1 rounded-md bg-zinc-100 p-3 font-mono text-sm text-red-700 dark:bg-zinc-900 dark:text-red-400">
                {error.message}
              </p>
            </div>

            {error.digest && (
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Error Digest
                </h3>
                <p className="mt-1 rounded-md bg-zinc-100 p-3 font-mono text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                  {error.digest}
                </p>
              </div>
            )}

            {error.stack && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Stack Trace (click to expand)
                </summary>
                <pre className="mt-2 overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={reset}
              className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-md border border-zinc-300 px-6 py-2 font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
            >
              Back to recipes
            </Link>
          </div>

          <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              What you can do
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-blue-800 dark:text-blue-200">
              <li>Click Try again to reload the page</li>
              <li>Go back to the recipes list and try a different recipe</li>
              <li>Check the error digest in your observability backend</li>
              <li>Review the stack trace for debugging information</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
