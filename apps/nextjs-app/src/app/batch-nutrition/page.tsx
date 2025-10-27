import Link from "next/link";
import { trace, SpanStatusCode } from "@opentelemetry/api";

const EXPRESS_URL = process.env.EXPRESS_URL || "http://localhost:3001";

type RecipeNutrition = {
  recipeId: string;
  title: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

type BatchNutritionResponse = {
  recipes: RecipeNutrition[];
  count: number;
};

async function getBatchNutrition(recipeIds: string[]) {
  try {
    const response = await fetch(`${EXPRESS_URL}/batch/nutrition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeIds }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to get batch nutrition: ${response.status}`);
    }

    const data = await response.json();

    if ("error" in data) {
      throw new Error(data.error);
    }

    return data as BatchNutritionResponse;
  } catch (error) {
    const activeSpan = trace.getActiveSpan();
    if (error instanceof Error) {
      activeSpan?.recordException(error);
      activeSpan?.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    }
    return {
      recipes: [],
      count: 0,
    };
  }
}

export default async function BatchNutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await searchParams;
  const ids = params.ids ? params.ids.split(",") : ["1", "2", "3"];
  const nutritionData = await getBatchNutrition(ids);

  const totals = nutritionData.recipes.reduce(
    (acc, recipe) => ({
      calories: acc.calories + recipe.calories,
      protein: acc.protein + recipe.protein,
      fat: acc.fat + recipe.fat,
      carbs: acc.carbs + recipe.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Call Chain:</strong> Next.js &rarr; Express &rarr; GraphQL
            &rarr; Express
          </p>
          <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
            Express fetches recipes from GraphQL, then calls itself for
            nutrition data
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Batch Nutrition Analysis
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Compare nutritional information across multiple recipes
            </p>
          </header>

          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-950">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Total Calories
              </h3>
              <p className="mt-1 text-3xl font-bold text-orange-900 dark:text-orange-100">
                {totals.calories.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Total Protein
              </h3>
              <p className="mt-1 text-3xl font-bold text-red-900 dark:text-red-100">
                {Math.round(totals.protein)}g
              </p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Total Fat
              </h3>
              <p className="mt-1 text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                {Math.round(totals.fat)}g
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Total Carbs
              </h3>
              <p className="mt-1 text-3xl font-bold text-green-900 dark:text-green-100">
                {Math.round(totals.carbs)}g
              </p>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Recipe Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700">
                <thead className="bg-zinc-100 dark:bg-zinc-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Recipe
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Calories
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Protein
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Fat
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Carbs
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {nutritionData.recipes.map((recipe) => (
                    <tr key={recipe.recipeId}>
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {recipe.title}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-700 dark:text-zinc-300">
                        {recipe.calories.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-700 dark:text-zinc-300">
                        {recipe.protein}g
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-700 dark:text-zinc-300">
                        {recipe.fat}g
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-700 dark:text-zinc-300">
                        {recipe.carbs}g
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/recipes/${recipe.recipeId}/nutrition`}
                          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Nutritional Breakdown by Recipe
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {nutritionData.recipes.map((recipe) => (
                <div
                  key={recipe.recipeId}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-600 dark:bg-zinc-700"
                >
                  <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {recipe.title}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Calories
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {recipe.calories}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Protein
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {recipe.protein}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Fat
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {recipe.fat}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Carbs
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {recipe.carbs}g
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/recipes/${recipe.recipeId}`}
                    className="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View recipe &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-8 rounded-lg bg-zinc-100 p-6 dark:bg-zinc-700">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Compare Other Recipes
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/batch-nutrition?ids=1,2"
                className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-600"
              >
                Pancakes vs Fried Rice
              </Link>
              <Link
                href="/batch-nutrition?ids=1,2,3"
                className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-600"
              >
                All 3 Recipes
              </Link>
              <Link
                href="/batch-nutrition?ids=2,3"
                className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-600"
              >
                Dinner Recipes Only
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
