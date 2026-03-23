import { createServerFn } from "@tanstack/react-start";
import { getExpressUrl } from "@obs-playground/env";
import { trace } from "@opentelemetry/api";
import { z } from "zod";
import type { MealPlanEstimate } from "../types";

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

export const getMealPlanEstimate = createServerFn({ method: "GET" })
  .inputValidator((ids: string) => ids)
  .handler(async ({ data: ids }): Promise<MealPlanEstimate> => {
    const activeSpan = trace.getActiveSpan();
    const recipeIds = ids.split(",");

    activeSpan?.setAttributes({
      "meal_plan.recipe_count": recipeIds.length,
      "meal_plan.day_count": 7,
    });

    const response = await fetch(
      `${getExpressUrl()}/meal-plan/estimate?recipeIds=${ids}`,
      { cache: "no-store" },
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

    return result.data;
  });
