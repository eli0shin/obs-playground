import Link from "next/link";

export default function ErrorTestingHub() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Warning:</strong> All pages in this section are designed to
            fail for telemetry testing purposes.
          </p>
          <p className="mt-1 text-xs text-red-700 dark:text-red-300">
            These pages intentionally trigger errors, timeouts, and failures to
            test observability instrumentation.
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Error Testing Scenarios
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Test pages for observability and error tracking
            </p>
          </header>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Server Errors
            </h2>
            <div className="grid gap-4">
              <Link
                href="/testing/errors/500"
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-red-300 hover:bg-red-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-red-800 dark:hover:bg-red-950/20"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  500 Internal Server Error
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Page that throws an error during render
                </p>
              </Link>

              <Link
                href="/testing/errors/not-found"
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-red-300 hover:bg-red-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-red-800 dark:hover:bg-red-950/20"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  404 Not Found (GraphQL)
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Attempts to fetch a non-existent recipe from GraphQL
                </p>
              </Link>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              API Errors
            </h2>
            <div className="grid gap-4">
              <Link
                href="/testing/errors/express-error"
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-red-300 hover:bg-red-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-red-800 dark:hover:bg-red-950/20"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  Express API Error
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Calls Express endpoint that always returns 500
                </p>
              </Link>

              <Link
                href="/testing/errors/graphql-error"
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-red-300 hover:bg-red-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-red-800 dark:hover:bg-red-950/20"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  GraphQL Error
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Calls GraphQL query that always throws an error
                </p>
              </Link>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Performance Issues
            </h2>
            <div className="grid gap-4">
              <Link
                href="/testing/errors/timeout"
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-yellow-300 hover:bg-yellow-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-yellow-800 dark:hover:bg-yellow-950/20"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  Timeout (30s)
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Calls slow Express endpoint with 30-second delay
                </p>
              </Link>

              <Link
                href="/testing/errors/partial-failure"
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-orange-800 dark:hover:bg-orange-950/20"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  Partial Failure
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Parallel fetches where some succeed and some fail
                </p>
              </Link>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Suspense Streaming
            </h2>
            <div className="grid gap-4">
              <Link
                href="/testing/errors/suspense-error"
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-purple-800 dark:hover:bg-purple-950/20"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  Suspense Error
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Component that errors after Suspense boundary starts streaming
                </p>
              </Link>

              <Link
                href="/testing/errors/nested-suspense"
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-purple-800 dark:hover:bg-purple-950/20"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  Nested Suspense Errors
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Multiple Suspense boundaries with partial failures
                </p>
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
