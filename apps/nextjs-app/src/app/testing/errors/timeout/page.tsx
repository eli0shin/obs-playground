import Link from "next/link";

const EXPRESS_URL = process.env.EXPRESS_BASE_URL || "http://localhost:3001";

async function callSlowEndpoint() {
  const startTime = Date.now();

  const response = await fetch(`${EXPRESS_URL}/api/slow/timeout`, {
    cache: "no-store",
  });

  const endTime = Date.now();
  const duration = endTime - startTime;

  const data = await response.json();

  return { data, duration };
}

export default async function TimeoutPage() {
  const { data, duration } = await callSlowEndpoint();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/testing/errors"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to error testing
        </Link>

        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> This page took {Math.round(duration / 1000)}{" "}
            seconds to load
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Timeout Test Complete
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            This page successfully waited 30 seconds before rendering
          </p>
          <div className="mt-4 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
              Response Data
            </h3>
            <pre className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </article>
      </div>
    </div>
  );
}
