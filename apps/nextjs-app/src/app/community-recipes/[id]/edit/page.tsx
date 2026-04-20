import Link from "next/link";
import { notFound } from "next/navigation";
import { graphqlRequest } from "@obs-playground/graphql-client";
import { getExpressUrl } from "@obs-playground/env";
import { updateCommunityRecipeAction } from "../../actions";
import { communityRecipeSchema, type CommunityRecipe } from "../../schema";

type Category = { id: string; name: string; slug: string };
type Ingredient = { id: string; name: string; unit: string };

async function getCommunityRecipe(id: string): Promise<CommunityRecipe | null> {
  const response = await fetch(`${getExpressUrl()}/community-recipes/${id}`, {
    cache: "no-store",
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to load recipe: ${response.status}`);
  }
  return communityRecipeSchema.parse(await response.json());
}

async function getCategoriesAndIngredients() {
  return graphqlRequest<{ categories: Category[]; ingredients: Ingredient[] }>(
    `
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
  );
}

export default async function EditCommunityRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [recipe, { categories, ingredients }] = await Promise.all([
    getCommunityRecipe(id),
    getCategoriesAndIngredients(),
  ]);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href={`/community-recipes/${recipe.id}`}
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to recipe
        </Link>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Edit Recipe
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Updates a row in Express&apos;s SQLite DB.
            </p>
          </header>

          <form
            action={updateCommunityRecipeAction.bind(null, recipe.id)}
            className="space-y-6"
          >
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
                defaultValue={recipe.title}
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
                rows={3}
                defaultValue={recipe.description}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
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
                  defaultValue={recipe.prepTime}
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
                  defaultValue={recipe.cookTime}
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
                  defaultValue={recipe.difficulty}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
                >
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
                  defaultValue={recipe.servings}
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

            <div>
              <label
                htmlFor="ingredients"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
              >
                Ingredients (read-only in this demo)
              </label>
              <input
                type="hidden"
                id="ingredients"
                name="ingredients"
                value={JSON.stringify(recipe.ingredients)}
              />
              <div className="mt-2 space-y-2 rounded-md border border-zinc-300 p-4 dark:border-zinc-600">
                {recipe.ingredients.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No ingredients attached.
                  </p>
                ) : (
                  recipe.ingredients.map((entry) => {
                    const info = ingredients.find(
                      (i) => i.id === entry.ingredientId,
                    );
                    return (
                      <div
                        key={entry.ingredientId}
                        className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        <span>
                          {info
                            ? `${entry.quantity} ${info.unit} ${info.name}`
                            : `${entry.quantity} units (id ${entry.ingredientId})`}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
              >
                Save Changes
              </button>
              <Link
                href={`/community-recipes/${recipe.id}`}
                className="rounded-md border border-zinc-300 px-6 py-2 font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
              >
                Cancel
              </Link>
            </div>
          </form>
        </article>
      </div>
    </div>
  );
}
