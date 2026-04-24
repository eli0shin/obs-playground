import type { ExpressRecipeResponse } from "../types/index.js";
import { categories, ingredients } from "../data/index.js";

export const Recipe = {
  category: (recipe: ExpressRecipeResponse) => {
    return categories.find((c) => c.id === recipe.categoryId);
  },
  ingredients: (recipe: ExpressRecipeResponse) => {
    const recipeIngs = recipe.ingredients;
    return recipeIngs.map((ri) => ({
      ingredient: ingredients.find((i) => i.id === ri.ingredientId),
      quantity: ri.quantity,
    }));
  },
};
