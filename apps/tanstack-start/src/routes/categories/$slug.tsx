import { createFileRoute, Link } from "@tanstack/react-router";
import { getCategoriesAndRecipes } from "../../server-fns/recipes";

export const Route = createFileRoute("/categories/$slug")({
  loader: ({ params }) =>
    getCategoriesAndRecipes().then((data) => {
      const category = data.categories.find((c) => c.slug === params.slug);
      const recipes = category
        ? data.recipes.filter((r) => r.categoryId === category.id)
        : [];
      return { category, recipes };
    }),
  component: CategoryPage,
});

function CategoryPage() {
  const { category, recipes } = Route.useLoaderData();

  if (!category) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Category not found
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
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link
          to="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {category.name} Recipes
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} found
          </p>
        </header>

        {recipes.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            No recipes found in this category.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                to="/recipes/$id"
                params={{ id: recipe.id }}
                className="rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
              >
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {recipe.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {recipe.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                  <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-700">
                    {recipe.difficulty}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-700">
                    Prep: {recipe.prepTime}min
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-700">
                    Cook: {recipe.cookTime}min
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-700">
                    Serves {recipe.servings}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
