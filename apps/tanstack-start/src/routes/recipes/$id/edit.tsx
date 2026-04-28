import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getCategoriesAndIngredients, getRecipe } from "../../../server-fns/recipes";
import { updateRecipe } from "../../../server-fns/mutations";

export const Route = createFileRoute("/recipes/$id/edit")({
  loader: async ({ params }) => {
    const [recipe, { categories }] = await Promise.all([
      getRecipe({ data: params.id }),
      getCategoriesAndIngredients(),
    ]);
    return { categories, recipe };
  },
  component: EditRecipePage,
});

const difficulties = ["Easy", "Medium", "Hard"];

function EditRecipePage() {
  const { categories, recipe } = Route.useLoaderData();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  if (!recipe) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Recipe not found
          </h1>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      await updateRecipe({
        data: {
          id: recipe.id,
          recipe: {
            title: String(formData.get("title") ?? ""),
            description: String(formData.get("description") ?? ""),
            prepTime: Number(formData.get("prepTime")),
            cookTime: Number(formData.get("cookTime")),
            difficulty: String(formData.get("difficulty") ?? ""),
            servings: Number(formData.get("servings")),
            categoryId: String(formData.get("categoryId") ?? ""),
          },
        },
      });
      await navigate({ to: "/recipes/$id", params: { id: recipe.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update recipe");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          to="/recipes/$id"
          params={{ id: recipe.id }}
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to recipe
        </Link>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="mb-8 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Edit Recipe
          </h1>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Recipe Title
              </label>
              <input
                id="title"
                name="title"
                required
                defaultValue={recipe.title}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={recipe.description}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prepTime" className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  id="prepTime"
                  name="prepTime"
                  required
                  min="0"
                  defaultValue={recipe.prepTime}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>

              <div>
                <label htmlFor="cookTime" className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Cook Time (minutes)
                </label>
                <input
                  type="number"
                  id="cookTime"
                  name="cookTime"
                  required
                  min="0"
                  defaultValue={recipe.cookTime}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  required
                  defaultValue={recipe.difficulty}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="servings" className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Servings
                </label>
                <input
                  type="number"
                  id="servings"
                  name="servings"
                  required
                  min="1"
                  defaultValue={recipe.servings}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                defaultValue={recipe.categoryId}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
            >
              Save Changes
            </button>
          </form>
        </article>
      </div>
    </div>
  );
}
