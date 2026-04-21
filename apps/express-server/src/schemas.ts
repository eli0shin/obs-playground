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

export const communityRecipeDifficultySchema = z.enum([
  "Easy",
  "Medium",
  "Hard",
]);

const communityRecipeBaseSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  prepTime: z.number().int().nonnegative(),
  cookTime: z.number().int().nonnegative(),
  difficulty: communityRecipeDifficultySchema,
  servings: z.number().int().positive(),
  categoryId: z.string().min(1),
  ingredients: z.array(recipeIngredientInputSchema),
});

export const communityRecipeCreateSchema = communityRecipeBaseSchema.extend({
  description: z.string().default(""),
  ingredients: z.array(recipeIngredientInputSchema).default([]),
});

export const communityRecipeUpdateSchema = communityRecipeBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type CommunityRecipeCreateInput = z.infer<
  typeof communityRecipeCreateSchema
>;
export type CommunityRecipeUpdateInput = z.infer<
  typeof communityRecipeUpdateSchema
>;
