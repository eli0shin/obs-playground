import { createServerFn } from "@tanstack/react-start";
import { getExpressUrl } from "@obs-playground/env";
import { trace, SpanStatusCode } from "@opentelemetry/api";
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
      const err = new Error(
        `Failed to get batch nutrition: ${response.status}`,
      );
      activeSpan?.recordException(err);
      activeSpan?.setStatus({
        code: SpanStatusCode.ERROR,
        message: err.message,
      });
      throw err;
    }

    const json: unknown = await response.json();
    const result = batchNutritionResponseSchema.safeParse(json);
    if (!result.success) {
      const err = new Error("Invalid response format");
      activeSpan?.recordException(err);
      activeSpan?.setStatus({
        code: SpanStatusCode.ERROR,
        message: err.message,
      });
      throw err;
    }

    return result.data;
  });
