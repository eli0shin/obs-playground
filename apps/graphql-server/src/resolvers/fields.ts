import type { Recipe as RecipeType } from "../types/index.js";
import type { RecipeResolvers as RecipeResolverMap } from "../generated/resolvers-types.js";
import { categories, ingredients, recipeIngredients } from "../data/index.js";

export const Recipe = {
  category: (recipe: RecipeType) => {
    return categories.find((c) => c.id === recipe.categoryId) ?? null;
  },
  ingredients: (recipe: RecipeType) => {
    const recipeIngs = recipeIngredients.filter(
      (ri) => ri.recipeId === recipe.id,
    );
    return recipeIngs.map((ri) => {
      const ingredient = ingredients.find((i) => i.id === ri.ingredientId);

      if (!ingredient) {
        throw new Error(
          `Ingredient ${ri.ingredientId} not found for recipe ${recipe.id}`,
        );
      }

      return {
        ingredient,
        quantity: ri.quantity,
      };
    });
  },
} satisfies RecipeResolverMap;
