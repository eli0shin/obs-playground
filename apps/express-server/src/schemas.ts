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

export const communityRecipeCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  prepTime: z.number().int().nonnegative(),
  cookTime: z.number().int().nonnegative(),
  difficulty: z.string().min(1),
  servings: z.number().int().positive(),
  categoryId: z.string().min(1),
  ingredients: z.array(recipeIngredientInputSchema).default([]),
});

export const communityRecipeUpdateSchema =
  communityRecipeCreateSchema.partial();

export type CommunityRecipeCreateInput = z.infer<
  typeof communityRecipeCreateSchema
>;
export type CommunityRecipeUpdateInput = z.infer<
  typeof communityRecipeUpdateSchema
>;
