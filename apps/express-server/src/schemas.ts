import { z } from "zod";

export const batchNutritionSchema = z.object({
  recipeIds: z.array(z.string()).min(1),
});

export const priceUpdateSchema = z.record(z.string(), z.number());

export const shoppingListSchema = z.object({
  recipeIds: z.array(z.string()).min(1),
  servings: z.record(z.string(), z.number()).optional(),
});
