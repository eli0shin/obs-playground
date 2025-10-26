import Link from "next/link";

import { GRAPHQL_URL } from "@/config";
const EXPRESS_URL = process.env.EXPRESS_URL || "http://localhost:3001";

type Ingredient = {
  id: string;
  name: string;
  unit: string;
};

type RecipeIngredient = {
  ingredient: Ingredient;
  quantity: number;
};

type Recipe = {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  ingredients: RecipeIngredient[];
};

type PriceData = {
  ingredientId: string;
  price: number;
};

type NutritionData = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

type InventoryData = {
  inStock: boolean;
  quantity: number;
};

async function getRecipe(id: string) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query GetRecipe($id: ID!) {
          recipe(id: $id) {
            id
            title
            description
            prepTime
            cookTime
            difficulty
            servings
            ingredients {
              ingredient {
                id
                name
                unit
              }
              quantity
            }
          }
        }
      `,
      variables: { id },
    }),
    cache: "no-store",
  });

  const { data } = await response.json();
  return data.recipe as Recipe;
}

async function getIngredientPrices(ingredientIds: string[]) {
  const response = await fetch(
    `${EXPRESS_URL}/ingredients/prices?ids=${ingredientIds.join(",")}`,
    { cache: "no-store" },
  );
  return response.json() as Promise<Record<string, number>>;
}

async function getIngredientNutrition(ingredientId: string) {
  const response = await fetch(
    `${EXPRESS_URL}/nutrition/ingredient/${ingredientId}`,
    {
      cache: "no-store",
    },
  );
  return response.json() as Promise<NutritionData>;
}

async function getIngredientStock(ingredientId: string) {
  const response = await fetch(
    `${EXPRESS_URL}/inventory/stock/${ingredientId}`,
    {
      cache: "no-store",
    },
  );
  return response.json() as Promise<InventoryData>;
}

export default async function FullRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Parallel fetches from GraphQL and Express
  const [recipe, prices] = await Promise.all([
    getRecipe(id),
    // We'll fetch prices after getting the recipe to know which ingredients to price
    getRecipe(id).then((r) =>
      getIngredientPrices(r.ingredients.map((i) => i.ingredient.id)),
    ),
  ]);

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

  // Fetch nutrition and stock data for all ingredients in parallel
  const ingredientData = await Promise.all(
    recipe.ingredients.map(async ({ ingredient, quantity }) => {
      const [nutrition, stock] = await Promise.all([
        getIngredientNutrition(ingredient.id),
        getIngredientStock(ingredient.id),
      ]);

      return {
        ingredient,
        quantity,
        price: prices[ingredient.id] || 0,
        nutrition,
        stock,
      };
    }),
  );

  const totalCost = ingredientData.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const totalNutrition = ingredientData.reduce(
    (acc, item) => ({
      calories: acc.calories + item.nutrition.calories * item.quantity,
      protein: acc.protein + item.nutrition.protein * item.quantity,
      fat: acc.fat + item.nutrition.fat * item.quantity,
      carbs: acc.carbs + item.nutrition.carbs * item.quantity,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );

  const outOfStockItems = ingredientData.filter((item) => !item.stock.inStock);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Link
          href={`/recipes/${id}`}
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to recipe
        </Link>

        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            <strong>Call Chain:</strong> Parallel Fetches (Next.js &rarr;
            GraphQL & Express)
          </p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
            Recipe data from GraphQL, pricing/nutrition/inventory from Express -
            all fetched in parallel
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

          <div className="mb-8 grid gap-6 md:grid-cols-2">
            {/* Cost Summary */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
              <h3 className="mb-4 text-lg font-semibold text-green-900 dark:text-green-100">
                Cost Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-green-800 dark:text-green-200">
                    Total Cost
                  </span>
                  <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700 dark:text-green-300">
                    Per Serving
                  </span>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    ${(totalCost / recipe.servings).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Nutrition Summary */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
              <h3 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100">
                Nutrition Summary
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">
                    Calories
                  </span>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {Math.round(totalNutrition.calories)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">
                    Protein
                  </span>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {Math.round(totalNutrition.protein)}g
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Fat</span>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {Math.round(totalNutrition.fat)}g
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">
                    Carbs
                  </span>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {Math.round(totalNutrition.carbs)}g
                  </p>
                </div>
              </div>
            </div>
          </div>

          {outOfStockItems.length > 0 && (
            <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                Out of Stock Alert
              </h3>
              <ul className="mt-2 list-inside list-disc text-sm text-orange-800 dark:text-orange-200">
                {outOfStockItems.map((item) => (
                  <li key={item.ingredient.id}>{item.ingredient.name}</li>
                ))}
              </ul>
            </div>
          )}

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Complete Ingredient Details
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700">
                <thead className="bg-zinc-100 dark:bg-zinc-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-900 dark:text-zinc-50">
                      Ingredient
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-900 dark:text-zinc-50">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-900 dark:text-zinc-50">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-900 dark:text-zinc-50">
                      Cal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-900 dark:text-zinc-50">
                      Protein
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-zinc-900 dark:text-zinc-50">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {ingredientData.map((item) => (
                    <tr
                      key={item.ingredient.id}
                      className={
                        !item.stock.inStock
                          ? "bg-orange-50 dark:bg-orange-950/20"
                          : ""
                      }
                    >
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {item.ingredient.name}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-600 dark:text-zinc-400">
                        {item.quantity} {item.ingredient.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-900 dark:text-zinc-50">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-600 dark:text-zinc-400">
                        {Math.round(item.nutrition.calories * item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-600 dark:text-zinc-400">
                        {Math.round(item.nutrition.protein * item.quantity)}g
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.stock.inStock ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                            In Stock
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                            Out
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="rounded-lg bg-zinc-100 p-6 dark:bg-zinc-700">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              View Specific Details
            </h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/recipes/${recipe.id}/with-cost`}
                className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-600"
              >
                Cost Analysis Only
              </Link>
              <Link
                href={`/recipes/${recipe.id}/nutrition`}
                className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-600"
              >
                Nutrition Facts Only
              </Link>
              <Link
                href={`/recipes/${recipe.id}`}
                className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-600"
              >
                Basic Recipe View
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
