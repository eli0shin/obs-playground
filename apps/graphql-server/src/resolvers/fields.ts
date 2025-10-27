import type { Recipe as RecipeType } from "../types/index.js";
import { categories, ingredients, recipeIngredients } from "../data/index.js";

export const Recipe = {
  category: (recipe: RecipeType) => {
    return categories.find((c) => c.id === recipe.categoryId);
  },
  ingredients: (recipe: RecipeType) => {
    const recipeIngs = recipeIngredients.filter(
      (ri) => ri.recipeId === recipe.id,
    );
    return recipeIngs.map((ri) => ({
      ingredient: ingredients.find((i) => i.id === ri.ingredientId),
      quantity: ri.quantity,
    }));
  },
};
