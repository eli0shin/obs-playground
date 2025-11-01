"use client";

import Link from "next/link";

export default function ErrorTestingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <div className="flex items-center">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="ml-3 text-xl font-bold text-green-900 dark:text-green-100">
              Error Test Successful!
            </h1>
          </div>
          <p className="mt-2 text-sm text-green-800 dark:text-green-200">
            The error was caught by the error boundary as expected. This is the
            correct behavior for telemetry testing.
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Error Caught by Testing Error Boundary
          </h2>

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
            <Link
              href="/testing/errors"
              className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              Back to Error Testing Hub
            </Link>
            <button
              onClick={reset}
              className="rounded-md border border-zinc-300 px-6 py-2 font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-md border border-zinc-300 px-6 py-2 font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
            >
              Go home
            </Link>
          </div>

          <div className="mt-8 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
            <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Telemetry Information
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-purple-800 dark:text-purple-200">
              <li>Error was caught by the testing/errors error boundary</li>
              <li>
                Error has been recorded in trace with error.intentional=true
              </li>
              <li>Span status set to ERROR with full context</li>
              <li>Check your observability backend for the complete trace</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
