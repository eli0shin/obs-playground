import type {
  Recipe as GraphqlRecipe,
  RecipeIngredientDetail,
} from "../generated/resolvers-types.js";
import type { ExpressRecipeResponse } from "../types/index.js";
import { categories, ingredients } from "../data/index.js";

function toRecipeIngredientDetail(
  recipe: ExpressRecipeResponse,
): RecipeIngredientDetail[] {
  return recipe.ingredients.map((ri) => {
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
}

export function toGraphqlRecipe(
  recipe: ExpressRecipeResponse,
): GraphqlRecipe {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    categoryId: recipe.categoryId,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    category: categories.find((c) => c.id === recipe.categoryId) ?? null,
    ingredients: toRecipeIngredientDetail(recipe),
  };
}
