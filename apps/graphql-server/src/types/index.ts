import type { Recipe } from "../generated/resolvers-types.js";

export type NutritionData = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type ExpressRecipeResponse = Omit<
  Recipe,
  "__typename" | "category" | "ingredients"
> & {
  ingredients: { ingredientId: string; quantity: number }[];
};
