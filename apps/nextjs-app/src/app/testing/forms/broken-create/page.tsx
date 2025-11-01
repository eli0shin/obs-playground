import Link from "next/link";
import { brokenCreateRecipeAction } from "@/app/recipes/actions";

export default function BrokenCreatePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/"
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
              Server Action that always fails with GraphQL error
            </p>
          </header>

          <form action={brokenCreateRecipeAction} className="space-y-6">
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
                href="/"
                className="rounded-md border border-zinc-300 px-6 py-2 font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
              >
                Cancel
              </Link>
            </div>
          </form>

          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
              Expected Behavior
            </h3>
            <p className="mt-1 text-xs text-red-800 dark:text-red-200">
              This Server Action calls the GraphQL errorMutation which always
              throws an error. The trace will show: Next.js → Server Action →
              GraphQL errorMutation → Error
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
