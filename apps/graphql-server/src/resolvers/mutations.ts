import { trace } from "@opentelemetry/api";
import type { Recipe, RecipeIngredient } from "../types/index.js";
import {
  recipes,
  recipeIngredients,
  categories,
  ingredients,
  incrementRecipeIdCounter,
} from "../data/index.js";
import { logger } from "../otel.js";

function diffRecipeFields(
  previous: Recipe,
  next: Omit<Recipe, "id">,
): string[] {
  const changed: string[] = [];
  const keys: (keyof Omit<Recipe, "id">)[] = [
    "title",
    "description",
    "prepTime",
    "cookTime",
    "difficulty",
    "servings",
    "categoryId",
  ];
  for (const key of keys) {
    if (previous[key] !== next[key]) {
      changed.push(key);
    }
  }
  return changed;
}

export const Mutation = {
  createRecipe: (
    _: unknown,
    {
      input,
    }: {
      input: { recipe: Omit<Recipe, "id">; ingredients: RecipeIngredient[] };
    },
  ) => {
    const activeSpan = trace.getActiveSpan();
    const newRecipe = {
      id: String(incrementRecipeIdCounter()),
      ...input.recipe,
    } satisfies Recipe;
    recipes.push(newRecipe);

    input.ingredients.forEach((ing) => {
      recipeIngredients.push({
        recipeId: newRecipe.id,
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
      });
    });

    const category = categories.find((c) => c.id === newRecipe.categoryId);
    const ingredientCategories = [
      ...new Set(
        input.ingredients
          .map((ing) => {
            const ingredient = ingredients.find(
              (i) => i.id === ing.ingredientId,
            );
            return ingredient?.category;
          })
          .filter(Boolean),
      ),
    ];

    activeSpan?.setAttributes({
      "recipe.id": newRecipe.id,
      "recipe.title": newRecipe.title,
      "recipe.category": category?.name || "Unknown",
      "recipe.difficulty": newRecipe.difficulty,
      "recipe.prep_time": newRecipe.prepTime,
      "recipe.cook_time": newRecipe.cookTime,
      "recipe.total_time": newRecipe.prepTime + newRecipe.cookTime,
      "recipe.servings": newRecipe.servings,
      "recipe.ingredient_count": input.ingredients.length,
      "recipe.ingredient_categories": ingredientCategories,
    });

    logger.info("Recipe created", {
      "recipe.id": newRecipe.id,
      "recipe.title": newRecipe.title,
      "recipe.category": category?.name,
      "recipe.difficulty": newRecipe.difficulty,
      "recipe.servings": newRecipe.servings,
      "recipe.ingredient_count": input.ingredients.length,
      "recipe.ingredient_categories": ingredientCategories,
    });

    return newRecipe;
  },

  updateRecipe: (
    _: unknown,
    { id, recipe }: { id: string; recipe: Omit<Recipe, "id"> },
  ) => {
    const activeSpan = trace.getActiveSpan();
    const index = recipes.findIndex((r) => r.id === id);
    activeSpan?.setAttributes({
      "recipe.id": id,
    });

    if (index === -1) {
      logger.warn("Recipe update target not found", {
        "recipe.id": id,
      });
      return null;
    }

    const previous = recipes[index];
    const changedFields = diffRecipeFields(previous, recipe);

    const updatedRecipe = { id, ...recipe };
    recipes[index] = updatedRecipe;

    const category = categories.find((c) => c.id === updatedRecipe.categoryId);

    activeSpan?.setAttributes({
      "recipe.title": updatedRecipe.title,
      "recipe.category": category?.name,
    });

    logger.info("Recipe updated", {
      "recipe.id": id,
      "recipe.changed_fields": changedFields,
      "recipe.changed_field_count": changedFields.length,
    });

    return recipes[index];
  },

  deleteRecipe: (_: unknown, { id }: { id: string }) => {
    const activeSpan = trace.getActiveSpan();
    const index = recipes.findIndex((r) => r.id === id);
    activeSpan?.setAttributes({
      "recipe.id": id,
    });

    if (index === -1) {
      logger.warn("Recipe deletion target not found", {
        "recipe.id": id,
      });
      return false;
    }

    const recipe = recipes[index];
    const category = categories.find((c) => c.id === recipe.categoryId);

    recipes.splice(index, 1);
    const ingIndexes = recipeIngredients
      .map((ri, idx) => (ri.recipeId === id ? idx : -1))
      .filter((idx) => idx !== -1)
      .reverse();
    ingIndexes.forEach((idx) => recipeIngredients.splice(idx, 1));

    activeSpan?.setAttributes({
      "recipe.title": recipe.title,
      "recipe.category": category?.name,
    });

    logger.info("Recipe deleted", {
      "recipe.id": id,
      "recipe.title": recipe.title,
      "recipe.category": category?.name,
      "recipe.ingredient_links_removed": ingIndexes.length,
    });

    return true;
  },
};
