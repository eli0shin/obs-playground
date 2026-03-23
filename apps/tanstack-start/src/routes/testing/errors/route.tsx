import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/testing/errors")({
  component: TestingErrorsLayout,
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
          <h1 className="text-2xl font-bold text-green-900 dark:text-green-100">
            Error Test Successful!
          </h1>
          <p className="mt-2 text-green-800 dark:text-green-200">
            {error.message}
          </p>
          <Link
            to="/testing/errors"
            className="mt-4 inline-block text-green-700 hover:underline dark:text-green-300"
          >
            &larr; Back to error tests
          </Link>
        </div>
      </div>
    </div>
  ),
});

function TestingErrorsLayout() {
  return <Outlet />;
}
