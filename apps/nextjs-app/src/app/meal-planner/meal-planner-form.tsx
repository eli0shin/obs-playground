"use client";

import Link from "next/link";
import { useActionState } from "react";
import { generateMealPlan, type MealPlanActionState } from "./actions";

const initialMealPlanActionState = {
  result: null,
  error: null,
} satisfies MealPlanActionState;

const customerSegments = [
  "budget_family",
  "vegetarian",
  "fitness_focused",
  "busy_professional",
];
const regions = ["northeast", "midwest", "south", "west"];
const diets = ["vegetarian", "omnivore"];

export function MealPlannerForm() {
  const [state, formAction, isPending] = useActionState(
    generateMealPlan,
    initialMealPlanActionState,
  );
  const result = state.result;

  return (
    <>
      <form
        action={formAction}
        className="mb-8 grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <input type="hidden" name="servings" value="4" />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Customer segment
            <select
              name="customerSegment"
              defaultValue="budget_family"
              className="mt-1 w-full rounded border p-2 dark:bg-zinc-800"
            >
              {customerSegments.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Region
            <select
              name="fulfillmentRegion"
              defaultValue="northeast"
              className="mt-1 w-full rounded border p-2 dark:bg-zinc-800"
            >
              {regions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Diet
            <select
              name="diet"
              defaultValue="vegetarian"
              className="mt-1 w-full rounded border p-2 dark:bg-zinc-800"
            >
              {diets.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Allergens CSV
            <input
              name="allergens"
              placeholder="dairy,gluten"
              className="mt-1 w-full rounded border p-2 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Preferences CSV
            <input
              name="preferences"
              defaultValue="quick"
              placeholder="quick,high_protein"
              className="mt-1 w-full rounded border p-2 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Budget max USD
            <input
              name="budgetMaxUsd"
              type="number"
              defaultValue="25"
              className="mt-1 w-full rounded border p-2 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Meals
            <input
              name="mealCount"
              type="number"
              defaultValue="3"
              className="mt-1 w-full rounded border p-2 dark:bg-zinc-800"
            />
          </label>
        </div>

        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Failure scenario
          <select
            name="failureScenario"
            defaultValue="none"
            className="mt-1 w-full rounded border p-2 dark:bg-zinc-800"
          >
            <option value="none">none</option>
            <option value="vegetarian_produce_shortage_northeast">
              vegetarian_produce_shortage_northeast
            </option>
          </select>
        </label>

        <button
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Generating..." : "Generate meal plan"}
        </button>
      </form>

      {state.error ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Planning request failed
          </h2>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            {state.error}
          </p>
        </section>
      ) : null}

      {result ? (
        <section
          className={`rounded-lg border p-6 ${
            result.outcome === "success"
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
          }`}
        >
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {result.outcome === "success"
              ? "Meal plan generated"
              : "Planning could not build a valid meal plan"}
          </h2>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            Reason: {result.failureReason}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <strong>{result.plan.recipeCount}</strong>
              <br />
              recipes
            </div>
            <div>
              <strong>${result.plan.estimatedCostUsd.toFixed(2)}</strong>
              <br />
              estimated cost
            </div>
            <div>
              <strong>{Math.round(result.plan.estimatedCalories)}</strong>
              <br />
              estimated calories
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {result.plan.recipes.map((recipe) => (
              <div
                key={recipe.recipeId}
                className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <Link
                  href={`/recipes/${recipe.recipeId}`}
                  className="font-semibold text-blue-700 hover:underline dark:text-blue-300"
                >
                  {recipe.title}
                </Link>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  ${recipe.cost.toFixed(2)} · {Math.round(recipe.calories)}
                  calories · {recipe.ingredientNames.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
