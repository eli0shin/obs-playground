import Link from "next/link";
import { getExpressUrl } from "@obs-playground/env";
import { z } from "zod";
import { logger } from "@/logger";

const recipeCostSchema = z.object({
  recipeId: z.string(),
  title: z.string(),
  cost: z.number(),
});

const mealPlanEstimateSchema = z.object({
  recipes: z.array(recipeCostSchema),
  totalWeeklyCost: z.number(),
  averageMealCost: z.number(),
  mealCount: z.number(),
});

const errorResponseSchema = z.object({
  error: z.unknown(),
});

type MealPlanEstimate = z.infer<typeof mealPlanEstimateSchema>;

async function getMealPlanEstimate(
  recipeIds: string[],
): Promise<MealPlanEstimate> {
  const fetchStart = Date.now();
  const response = await fetch(
    `${getExpressUrl()}/meal-plan/estimate?recipeIds=${recipeIds.join(",")}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get meal plan estimate: ${response.status}`);
  }

  const json: unknown = await response.json();

  const errorResult = errorResponseSchema.safeParse(json);
  if (errorResult.success) {
    throw new Error(String(errorResult.data.error));
  }

  const result = mealPlanEstimateSchema.safeParse(json);
  if (!result.success) {
    throw new Error("Invalid response format");
  }

  logger.info("Meal planner page fetched", {
    "meal_plan.recipe_ids": recipeIds,
    "meal_plan.recipe_count": recipeIds.length,
    "meal_plan.meal_count": result.data.mealCount,
    "meal_plan.total_weekly_cost": result.data.totalWeeklyCost,
    "meal_plan.average_meal_cost": result.data.averageMealCost,
    "http.status_code": response.status,
    "http.duration_ms": Date.now() - fetchStart,
  });

  return result.data;
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
  const ids = params.ids?.split(",").filter(Boolean);

  if (!ids || ids.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <Link
            href="/"
            className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            &larr; Back to home
          </Link>

          <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
            <header className="mb-6">
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                Weekly Meal Planner
              </h1>
              <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                Select recipes first to create a meal plan.
              </p>
            </header>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                This page needs one or more recipe IDs in the `ids` query
                parameter.
              </p>
              <Link
                href="/"
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
                const dayIndex = index % 7;
                const day = DAYS_OF_WEEK[dayIndex];
                return (
                  <div
                    key={`day-${dayIndex}-${recipe.recipeId}`}
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
              {mealPlan.recipes.map((recipe) => (
                <div
                  key={`cost-${recipe.recipeId}`}
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
        </article>
      </div>
    </div>
  );
}
