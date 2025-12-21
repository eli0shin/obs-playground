import Link from "next/link";

const EXPRESS_URL = process.env.EXPRESS_BASE_URL || "http://localhost:3001";

type RecipeCost = {
  recipeId: string;
  title: string;
  cost: number;
};

type MealPlanEstimate = {
  recipes: RecipeCost[];
  totalWeeklyCost: number;
  averageMealCost: number;
  mealCount: number;
};

async function getMealPlanEstimate(recipeIds: string[]) {
  const response = await fetch(
    `${EXPRESS_URL}/meal-plan/estimate?recipeIds=${recipeIds.join(",")}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get meal plan estimate: ${response.status}`);
  }

  const data = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }

  return data as MealPlanEstimate;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default async function MealPlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await searchParams;
  const ids = params.ids
    ? params.ids.split(",")
    : ["1", "2", "3", "1", "2", "3", "1"];
  const mealPlan = await getMealPlanEstimate(ids);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Call Chain:</strong> Next.js &rarr; Express &rarr; GraphQL
          </p>
          <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
            Express API fetches recipes from GraphQL and calculates costs
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Weekly Meal Planner
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Plan your meals for the week and estimate costs
            </p>
          </header>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Total Weekly Cost
              </h3>
              <p className="mt-1 text-3xl font-bold text-blue-900 dark:text-blue-100">
                ${mealPlan.totalWeeklyCost.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Average per Meal
              </h3>
              <p className="mt-1 text-3xl font-bold text-green-900 dark:text-green-100">
                ${mealPlan.averageMealCost.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950">
              <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Total Meals
              </h3>
              <p className="mt-1 text-3xl font-bold text-purple-900 dark:text-purple-100">
                {mealPlan.mealCount}
              </p>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Weekly Schedule
            </h2>
            <div className="space-y-3">
              {mealPlan.recipes.map((recipe, index) => {
                const day = DAYS_OF_WEEK[index % 7];
                return (
                  <div
                    key={`${recipe.recipeId}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        {day.slice(0, 3)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {recipe.title}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {day}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        ${recipe.cost.toFixed(2)}
                      </p>
                      <Link
                        href={`/recipes/${recipe.recipeId}`}
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        View recipe
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-zinc-100 p-6 dark:border-zinc-600 dark:bg-zinc-700">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Cost Breakdown
            </h3>
            <div className="space-y-2">
              {mealPlan.recipes.map((recipe, index) => (
                <div
                  key={`${recipe.recipeId}-${index}`}
                  className="flex justify-between text-sm"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {recipe.title}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    ${recipe.cost.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t-2 border-zinc-300 pt-2 dark:border-zinc-600">
                <div className="flex justify-between font-bold">
                  <span className="text-zinc-900 dark:text-zinc-50">Total</span>
                  <span className="text-zinc-900 dark:text-zinc-50">
                    ${mealPlan.totalWeeklyCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 rounded-lg bg-zinc-50 p-6 dark:bg-zinc-800">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Try Different Plans
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/meal-planner?ids=1,1,1,1,1,1,1"
                className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-zinc-100 dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                Pancakes Every Day
              </Link>
              <Link
                href="/meal-planner?ids=1,2,3,1,2,3,1"
                className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-zinc-100 dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                Rotate All 3 Recipes
              </Link>
              <Link
                href="/meal-planner?ids=2,2,2,3,3,3,3"
                className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-zinc-100 dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                Dinner Focus
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
