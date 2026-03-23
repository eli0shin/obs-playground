import { createServerFn } from "@tanstack/react-start";
import { getExpressUrl } from "@obs-playground/env";
import { trace } from "@opentelemetry/api";
import { z } from "zod";
import type { NutritionData, InventoryData } from "../types";

const pricesSchema = z.record(z.string(), z.number());

const nutritionSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
});

const inventorySchema = z.object({
  inStock: z.boolean(),
  quantity: z.number(),
});

export const getFullRecipeDetails = createServerFn({ method: "GET" })
  .inputValidator(
    (data: {
      ingredientIds: string[];
      quantities: { id: string; qty: number }[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const activeSpan = trace.getActiveSpan();
    activeSpan?.setAttributes({
      "recipe.parallel_fetch_count": data.ingredientIds.length,
    });

    const prices = await getIngredientPrices(data.ingredientIds);

    const ingredientDetails = await Promise.all(
      data.quantities.map(async ({ id, qty }) => {
        const [nutrition, stock] = await Promise.all([
          getIngredientNutrition(id),
          getIngredientStock(id),
        ]);
        return {
          ingredientId: id,
          quantity: qty,
          price: prices[id] || 0,
          nutrition,
          stock,
        };
      }),
    );

    activeSpan?.setAttributes({
      "recipe.ingredient_prices_fetched": data.ingredientIds.length,
    });

    return ingredientDetails;
  });

async function getIngredientPrices(
  ingredientIds: string[],
): Promise<Record<string, number>> {
  const url = `${getExpressUrl()}/ingredients/prices?ids=${ingredientIds.join(",")}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const err = new Error(`HTTP ${response.status} fetching prices: ${url}`);
    trace.getActiveSpan()?.recordException(err);
    return {};
  }

  const json: unknown = await response.json();
  const result = pricesSchema.safeParse(json);
  return result.success ? result.data : {};
}

async function getIngredientNutrition(
  ingredientId: string,
): Promise<NutritionData> {
  const url = `${getExpressUrl()}/nutrition/ingredient/${ingredientId}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const err = new Error(`HTTP ${response.status} fetching nutrition: ${url}`);
    trace.getActiveSpan()?.recordException(err);
    return { calories: 0, protein: 0, fat: 0, carbs: 0 };
  }

  const json: unknown = await response.json();
  const result = nutritionSchema.safeParse(json);
  return result.success
    ? result.data
    : { calories: 0, protein: 0, fat: 0, carbs: 0 };
}

async function getIngredientStock(
  ingredientId: string,
): Promise<InventoryData> {
  const url = `${getExpressUrl()}/inventory/stock/${ingredientId}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const err = new Error(`HTTP ${response.status} fetching stock: ${url}`);
    trace.getActiveSpan()?.recordException(err);
    return { inStock: false, quantity: 0 };
  }

  const json: unknown = await response.json();
  const result = inventorySchema.safeParse(json);
  return result.success ? result.data : { inStock: false, quantity: 0 };
}
