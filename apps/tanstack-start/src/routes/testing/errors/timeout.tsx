import { createFileRoute } from "@tanstack/react-router";
import { getExpressTimeout } from "../../../server-fns/mutations";

export const Route = createFileRoute("/testing/errors/timeout")({
  loader: getExpressTimeout,
  component: TimeoutPage,
});

function TimeoutPage() {
  const { status, duration } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Timeout Test
          </h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Response received after {duration}ms with status {status}
          </p>
        </div>
      </div>
    </div>
  );
}
