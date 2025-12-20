import Link from "next/link";
import { graphqlRequest } from "@obs-playground/graphql-client";

export const dynamic = "force-dynamic";

async function fetchNonExistentRecipe() {
  const data = await graphqlRequest<{
    notFoundRecipe: { id: string; title: string; description: string } | null;
  }>(`
    query NotFoundRecipe {
      notFoundRecipe {
        id
        title
        description
      }
    }
  `);

  if (!data.notFoundRecipe) {
    throw new Error("Recipe not found - GraphQL returned null");
  }

  return data.notFoundRecipe;
}

export default async function NotFoundErrorPage() {
  await fetchNonExistentRecipe();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/testing/errors"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to error testing
        </Link>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            This page should never render
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            If you see this, something went wrong with the not-found test
          </p>
        </article>
      </div>
    </div>
  );
}
