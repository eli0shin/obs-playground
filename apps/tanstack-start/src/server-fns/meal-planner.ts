import { createServerFn } from "@tanstack/react-start";
import { getExpressUrl } from "@obs-playground/env";
import { trace, SpanStatusCode } from "@opentelemetry/api";
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

export const getMealPlanEstimate = createServerFn({ method: "GET" })
  .inputValidator((ids: string) => ids)
  .handler(async ({ data: ids }): Promise<MealPlanEstimate> => {
    const activeSpan = trace.getActiveSpan();
    try {
      const recipeIds = ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      activeSpan?.setAttributes({
        "meal_plan.recipe_count": recipeIds.length,
        "meal_plan.day_count": 7,
      });

      const response = await fetch(
        `${getExpressUrl()}/meal-plan/estimate?recipeIds=${recipeIds.join(",")}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(`Failed to get meal plan estimate: ${response.status}`);
      }

      const json: unknown = await response.json();
      const result = mealPlanEstimateSchema.safeParse(json);
      if (!result.success) {
        throw new Error("Invalid response format");
      }

      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      activeSpan?.recordException(error);
      activeSpan?.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw err;
    }
  });
