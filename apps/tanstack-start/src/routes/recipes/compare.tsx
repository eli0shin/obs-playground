import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { getRecipesWithCost } from "../../server-fns/recipes";

const compareSearchSchema = z.object({
  ids: z.string().optional(),
});

export const Route = createFileRoute("/recipes/compare")({
  validateSearch: compareSearchSchema,
  loaderDeps: ({ search }) => ({ ids: search.ids }),
  loader: ({ deps }) => {
    if (!deps.ids) {
      return null;
    }

    return getRecipesWithCost({ data: deps.ids });
  },
  component: CompareRecipesPage,
});

function CompareRecipesPage() {
  const recipes = Route.useLoaderData();

  if (!recipes) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <Link
            to="/"
            className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            &larr; Back to home
          </Link>

          <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
            <header className="mb-6">
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                Compare Recipes
              </h1>
              <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                Select recipes first to compare them.
              </p>
            </header>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                This page needs one or more recipe IDs in the `ids` query
                parameter.
              </p>
              <Link
                to="/"
                className="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                Browse recipes
              </Link>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link
          to="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Call Chain:</strong> TanStack Start &rarr; GraphQL &rarr;
            Express
          </p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
            Multiple parallel GraphQL queries, each calling Express API for
            pricing
          </p>
        </div>

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Compare Recipes
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Side-by-side comparison of recipe costs
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {recipes.filter(Boolean).map((recipe) => (
            <article
              key={recipe.id}
              className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <header className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {recipe.title}
                </h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {recipe.description}
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50">
                    {recipe.difficulty}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50">
                    Serves {recipe.servings}
                  </span>
                </div>
              </header>

              <div className="mb-4 rounded-lg bg-green-50 p-4 dark:bg-green-950">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Total Cost
                  </span>
                  <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                    ${recipe.totalCost.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                  ${(recipe.totalCost / recipe.servings).toFixed(2)} per serving
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Ingredients ({recipe.ingredientCosts.length})
                </h3>
                <ul className="space-y-2">
                  {recipe.ingredientCosts.map((item) => (
                    <li
                      key={item.ingredientId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {item.quantity} {item.unit} {item.name}
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        ${item.totalCost.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <Link
                  to="/recipes/$id"
                  params={{ id: recipe.id }}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  View full recipe &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
