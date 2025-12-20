import Link from "next/link";
import { graphqlRequest } from "@obs-playground/graphql-client";

type IngredientCost = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
};

type RecipeWithCost = {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  ingredientCosts: IngredientCost[];
  totalCost: number;
};

async function getRecipeWithCost(id: string) {
  const data = await graphqlRequest<{ recipeWithCost: RecipeWithCost }>(
    `
      query GetRecipeWithCost($id: ID!) {
        recipeWithCost(id: $id) {
          id
          title
          description
          prepTime
          cookTime
          difficulty
          servings
          ingredientCosts {
            ingredientId
            name
            quantity
            unit
            pricePerUnit
            totalCost
          }
          totalCost
        }
      }
    `,
    { id },
  );

  return data.recipeWithCost;
}

export default async function RecipeWithCostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipeWithCost(id);

  if (!recipe) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Recipe not found
          </h1>
          <Link
            href="/"
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
          href={`/recipes/${id}`}
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to recipe
        </Link>

        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Call Chain:</strong> Next.js &rarr; GraphQL &rarr; Express
          </p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
            GraphQL resolver fetches recipe data and calls Express API for
            pricing information
          </p>
        </div>

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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Ingredients with Pricing
              </h2>
              <div className="rounded-lg bg-green-100 px-4 py-2 dark:bg-green-900">
                <span className="text-lg font-bold text-green-800 dark:text-green-100">
                  Total: ${recipe.totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full">
                <thead className="bg-zinc-100 dark:bg-zinc-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Ingredient
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Price/Unit
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {recipe.ingredientCosts.map((item) => (
                    <tr key={item.ingredientId}>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-600 dark:text-zinc-400">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-600 dark:text-zinc-400">
                        ${item.pricePerUnit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        ${item.totalCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Cost per serving: $
              {(recipe.totalCost / recipe.servings).toFixed(2)}
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
