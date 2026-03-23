import { createFileRoute, Link } from "@tanstack/react-router";
import { getRecipe } from "../../../server-fns/recipes";

export const Route = createFileRoute("/recipes/$id/")({
  loader: ({ params }) => getRecipe({ data: params.id }),
  component: RecipePage,
});

function RecipePage() {
  const recipe = Route.useLoaderData();

  if (!recipe) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Recipe not found
          </h1>
          <Link
            to="/"
            className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          to="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to recipes
        </Link>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              {recipe.title}
            </h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              {recipe.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-700">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Difficulty: {recipe.difficulty}
                </span>
              </div>
              <div className="rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-700">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Prep: {recipe.prepTime} min
                </span>
              </div>
              <div className="rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-700">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Cook: {recipe.cookTime} min
                </span>
              </div>
              <div className="rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-700">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Serves: {recipe.servings}
                </span>
              </div>
            </div>
          </header>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Ingredients
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients?.map(({ ingredient, quantity }) => (
                <li
                  key={ingredient.id}
                  className="flex items-center text-zinc-700 dark:text-zinc-300"
                >
                  <span className="mr-2 h-2 w-2 rounded-full bg-blue-500" />
                  <span>
                    {quantity} {ingredient.unit} {ingredient.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-700">
            <h3 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              View More Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                to="/recipes/$id/with-cost"
                params={{ id: recipe.id }}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:border-zinc-500"
              >
                <h4 className="font-medium text-zinc-900 dark:text-zinc-50">
                  Recipe with Cost Analysis
                </h4>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  See ingredient pricing breakdown
                </p>
              </Link>
              <Link
                to="/recipes/$id/nutrition"
                params={{ id: recipe.id }}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:border-zinc-500"
              >
                <h4 className="font-medium text-zinc-900 dark:text-zinc-50">
                  Nutrition Information
                </h4>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  View calories and macros
                </p>
              </Link>
              <Link
                to="/recipes/$id/full"
                params={{ id: recipe.id }}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:border-zinc-500"
              >
                <h4 className="font-medium text-zinc-900 dark:text-zinc-50">
                  Complete View
                </h4>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  All details with parallel data fetching
                </p>
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
