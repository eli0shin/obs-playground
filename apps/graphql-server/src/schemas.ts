import { z } from "zod";

export const pricesResponseSchema = z.record(z.string(), z.number());

export const nutritionResponseSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
});

const expressRecipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  prepTime: z.number(),
  cookTime: z.number(),
  difficulty: z.string(),
  servings: z.number(),
  categoryId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  ingredients: z.array(
    z.object({
      ingredientId: z.string(),
      quantity: z.number(),
    }),
  ),
});

export const expressRecipeListSchema = z.object({
  recipes: z.array(expressRecipeSchema),
});

export const expressRecipeSingleSchema = expressRecipeSchema;
