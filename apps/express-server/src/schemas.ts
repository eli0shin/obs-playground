import { z } from "zod";

export const batchNutritionSchema = z.object({
  recipeIds: z.array(z.string()).min(1),
});

export const priceUpdateSchema = z.record(z.string(), z.number());

export const shoppingListSchema = z.object({
  recipeIds: z.array(z.string()).min(1),
  servings: z.record(z.string(), z.number()).optional(),
});

const recipeIngredientInputSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive(),
});

export const recipeDifficultySchema = z.enum(["Easy", "Medium", "Hard"]);

const recipeBaseSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  prepTime: z.number().int().nonnegative(),
  cookTime: z.number().int().nonnegative(),
  difficulty: recipeDifficultySchema,
  servings: z.number().int().positive(),
  categoryId: z.string().min(1),
  ingredients: z.array(recipeIngredientInputSchema),
});

export const recipeCreateSchema = recipeBaseSchema.extend({
  description: z.string().default(""),
  ingredients: z.array(recipeIngredientInputSchema).default([]),
});

export const recipeUpdateSchema = recipeBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type RecipeCreateInput = z.infer<typeof recipeCreateSchema>;
export type RecipeUpdateInput = z.infer<typeof recipeUpdateSchema>;
