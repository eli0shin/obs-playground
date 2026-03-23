import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/testing/errors/")({
  component: ErrorTestingHub,
});

function ErrorTestingHub() {
  const errorTests = [
    {
      path: "/testing/errors/500" as const,
      title: "500 Server Error",
      description: "Page that throws during render",
      color: "red",
    },
    {
      path: "/testing/errors/not-found" as const,
      title: "Not Found Error",
      description: "GraphQL returns null, then throws",
      color: "orange",
    },
    {
      path: "/testing/errors/express-error" as const,
      title: "Express API Error",
      description: "Express endpoint always returns 500",
      color: "red",
    },
    {
      path: "/testing/errors/graphql-error" as const,
      title: "GraphQL Error",
      description: "GraphQL query that always errors",
      color: "purple",
    },
    {
      path: "/testing/errors/timeout" as const,
      title: "Timeout Error",
      description: "Express endpoint with 30s delay",
      color: "yellow",
    },
    {
      path: "/testing/errors/partial-failure" as const,
      title: "Partial Failure",
      description: "Mix of success and failure responses",
      color: "blue",
    },
    {
      path: "/testing/errors/suspense-error" as const,
      title: "Deferred Error",
      description: "Deferred data that errors after delay",
      color: "pink",
    },
    {
      path: "/testing/errors/nested-suspense" as const,
      title: "Nested Deferred",
      description: "Nested deferred: outer succeeds, inner errors",
      color: "indigo",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          to="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Error Test Scenarios
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Pages designed to fail for observability testing
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {errorTests.map((test) => (
            <Link
              key={test.path}
              to={test.path}
              className={`rounded-lg border border-${test.color}-200 bg-${test.color}-50 p-6 transition-colors hover:border-${test.color}-300 dark:border-${test.color}-800 dark:bg-${test.color}-950 dark:hover:border-${test.color}-700`}
            >
              <h3
                className={`text-lg font-medium text-${test.color}-900 dark:text-${test.color}-100`}
              >
                {test.title}
              </h3>
              <p
                className={`mt-2 text-sm text-${test.color}-700 dark:text-${test.color}-300`}
              >
                {test.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
