import { createServerFn } from "@tanstack/react-start";
import { getExpressUrl } from "@obs-playground/env";
import { trace } from "@opentelemetry/api";
import { z } from "zod";
import type { BatchNutritionResponse } from "../types";

const recipeNutritionSchema = z.object({
  recipeId: z.string(),
  title: z.string(),
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
});

const batchNutritionResponseSchema = z.object({
  recipes: z.array(recipeNutritionSchema),
  count: z.number(),
});

const errorResponseSchema = z.object({
  error: z.unknown(),
});

export const getBatchNutrition = createServerFn({ method: "GET" })
  .inputValidator((ids: string) => ids)
  .handler(async ({ data: ids }): Promise<BatchNutritionResponse> => {
    const activeSpan = trace.getActiveSpan();
    const recipeIds = ids.split(",");

    activeSpan?.setAttributes({
      "batch_nutrition.recipe_count": recipeIds.length,
    });

    const response = await fetch(`${getExpressUrl()}/batch/nutrition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeIds }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to get batch nutrition: ${response.status}`);
    }

    const json: unknown = await response.json();

    const errorResult = errorResponseSchema.safeParse(json);
    if (errorResult.success) {
      throw new Error(String(errorResult.data.error));
    }

    const result = batchNutritionResponseSchema.safeParse(json);
    if (!result.success) {
      throw new Error("Invalid response format");
    }

    return result.data;
  });
