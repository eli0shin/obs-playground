import Link from "next/link";
import { GRAPHQL_URL } from "@/config";
import { createRecipeAction } from "../actions";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Ingredient = {
  id: string;
  name: string;
  unit: string;
};

async function getCategoriesAndIngredients() {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query GetCategoriesAndIngredients {
          categories {
            id
            name
            slug
          }
          ingredients {
            id
            name
            unit
          }
        }
      `,
    }),
    cache: "no-store",
  });

  const { data } = await response.json();
  return data as { categories: Category[]; ingredients: Ingredient[] };
}

export default async function NewRecipePage() {
  const { categories, ingredients } = await getCategoriesAndIngredients();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Create New Recipe
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Add a new recipe using Server Actions
            </p>
          </header>

          <form action={createRecipeAction} className="space-y-6">
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
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                placeholder="e.g., Chocolate Chip Cookies"
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
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                placeholder="Describe your recipe..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="prepTime"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
                >
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  id="prepTime"
                  name="prepTime"
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>

              <div>
                <label
                  htmlFor="cookTime"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
                >
                  Cook Time (minutes)
                </label>
                <input
                  type="number"
                  id="cookTime"
                  name="cookTime"
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="difficulty"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
                >
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  required
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                >
                  <option value="">Select difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="servings"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
                >
                  Servings
                </label>
                <input
                  type="number"
                  id="servings"
                  name="servings"
                  required
                  min="1"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
              >
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Ingredients
              </label>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Select 2-3 ingredients with quantities for this demo
              </p>
              <input
                type="hidden"
                name="ingredients"
                value={JSON.stringify([
                  { ingredientId: "1", quantity: 2 },
                  { ingredientId: "2", quantity: 1 },
                ])}
              />
              <div className="mt-2 space-y-2 rounded-md border border-zinc-300 p-4 dark:border-zinc-600">
                {ingredients.slice(0, 5).map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <span>{ingredient.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">
                      {ingredient.unit}
                    </span>
                  </div>
                ))}
                <p className="mt-2 text-xs italic text-zinc-500 dark:text-zinc-500">
                  Demo: Uses predefined ingredients (2x {ingredients[0].name},
                  1x {ingredients[1].name})
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
              >
                Create Recipe
              </button>
              <Link
                href="/"
                className="rounded-md border border-zinc-300 px-6 py-2 font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
              >
                Cancel
              </Link>
            </div>
          </form>

          <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Server Action Flow
            </h3>
            <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
              This form uses a Server Action to create a recipe via GraphQL
              mutation. The trace will show: Next.js → Server Action → GraphQL
              createRecipe mutation → Success redirect
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
