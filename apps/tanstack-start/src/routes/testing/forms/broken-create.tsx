import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { brokenCreateRecipe } from "../../../server-fns/mutations";

export const Route = createFileRoute("/testing/forms/broken-create")({
  component: BrokenCreatePage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
          <h1 className="text-2xl font-bold text-green-900 dark:text-green-100">
            Server Function Error Caught!
          </h1>
          <p className="mt-2 text-green-800 dark:text-green-200">
            {error.message}
          </p>
          <p className="mt-4 text-sm text-green-700 dark:text-green-300">
            Trace flow: Browser &rarr; TanStack Server Function &rarr; GraphQL
            errorMutation &rarr; Error
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-green-700 hover:underline dark:text-green-300"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  ),
});

function BrokenCreatePage() {
  const [error, setError] = useState<string | null>(null);
  const brokenCreate = useServerFn(brokenCreateRecipe);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await brokenCreate({});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          to="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Warning:</strong> This form is designed to always fail for
            telemetry testing.
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Broken Recipe Form
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Server Function that always fails with GraphQL error
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
              >
                Recipe Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                defaultValue="Test Recipe"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                defaultValue="This form will fail when submitted"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="rounded-md bg-red-600 px-6 py-2 font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
              >
                Submit (Will Fail)
              </button>
              <Link
                to="/"
                className="rounded-md border border-zinc-300 px-6 py-2 font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
              >
                Cancel
              </Link>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
              Expected Behavior
            </h3>
            <p className="mt-1 text-xs text-red-800 dark:text-red-200">
              This Server Function calls the GraphQL errorMutation which always
              throws an error. The trace will show: TanStack Start → Server
              Function → GraphQL errorMutation → Error
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
