"use server";

import { cookies } from "next/headers";
import { getExpressUrl } from "@obs-playground/env";
import { trace } from "@opentelemetry/api";
import { z } from "zod";

const generatedMealPlanSchema = z.object({
  outcome: z.enum(["success", "no_plan"]),
  failureReason: z.string(),
  constraints: z.object({
    customerSegment: z.string(),
    fulfillmentRegion: z.string(),
    diet: z.string(),
    allergens: z.array(z.string()),
    preferences: z.array(z.string()),
    budgetMaxUsd: z.number(),
    servings: z.number(),
    mealCount: z.number(),
    failureScenario: z.string(),
  }),
  plan: z.object({
    recipes: z.array(
      z.object({
        recipeId: z.string(),
        title: z.string(),
        cost: z.number(),
        calories: z.number(),
        ingredientNames: z.array(z.string()),
      }),
    ),
    recipeCount: z.number(),
    estimatedCostUsd: z.number(),
    estimatedCalories: z.number(),
  }),
  diagnostics: z.object({
    candidateRecipeCount: z.number(),
    viableRecipeCount: z.number(),
    rejectedRecipeCount: z.number(),
  }),
});

export type GeneratedMealPlan = z.infer<typeof generatedMealPlanSchema>;

export type MealPlanActionState = {
  result: GeneratedMealPlan | null;
  error: string | null;
};

function parseCsv(value: FormDataEntryValue | null) {
  return typeof value === "string"
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function getFormString(formData: FormData, key: string, fallback: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function getFormNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

export async function generateMealPlan(
  _previousState: MealPlanActionState,
  formData: FormData,
): Promise<MealPlanActionState> {
  const activeSpan = trace.getActiveSpan();
  const constraints = {
    customerSegment: getFormString(formData, "customerSegment", "budget_family"),
    fulfillmentRegion: getFormString(formData, "fulfillmentRegion", "northeast"),
    diet: getFormString(formData, "diet", "vegetarian"),
    allergens: parseCsv(formData.get("allergens")),
    preferences: parseCsv(formData.get("preferences")),
    budgetMaxUsd: getFormNumber(formData, "budgetMaxUsd", 25),
    servings: getFormNumber(formData, "servings", 4),
    mealCount: getFormNumber(formData, "mealCount", 3),
    failureScenario: getFormString(formData, "failureScenario", "none"),
  };
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("app_session_id")?.value ?? "unknown";
  const userId = cookieStore.get("app_user_id")?.value ?? `user-${sessionId}`;

  activeSpan?.setAttributes({
    "app.session.id": sessionId,
    "app.user.id": userId,
    "app.customer.segment": constraints.customerSegment,
    "app.fulfillment.region": constraints.fulfillmentRegion,
    "app.constraint.diet": constraints.diet,
    "app.constraint.allergens": constraints.allergens.join(",") || "none",
    "app.constraint.preferences": constraints.preferences.join(",") || "none",
    "app.constraint.budget.max_usd": constraints.budgetMaxUsd,
    "app.constraint.servings": constraints.servings,
    "app.constraint.meal_count": constraints.mealCount,
    "app.demo.failure_scenario": constraints.failureScenario,
  });

  try {
    const response = await fetch(`${getExpressUrl()}/meal-plan/generate`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-app-session-id": sessionId,
        "x-app-user-id": userId,
      },
      body: JSON.stringify(constraints),
    });

    const json: unknown = await response.json();
    const parsed = generatedMealPlanSchema.parse(json);

    activeSpan?.setAttributes({
      "app.planning.outcome": parsed.outcome,
      "app.planning.failure.reason": parsed.failureReason,
      "app.meal_plan.recipe_count": parsed.plan.recipeCount,
      "app.meal_plan.estimated_cost_usd": parsed.plan.estimatedCostUsd,
      "app.meal_plan.estimated_calories": parsed.plan.estimatedCalories,
    });

    return { result: parsed, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    activeSpan?.recordException(err);
    return { result: null, error: err.message };
  }
}
