import { z } from "zod";

export const communityRecipeSchema = z.object({
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

export type CommunityRecipe = z.infer<typeof communityRecipeSchema>;
