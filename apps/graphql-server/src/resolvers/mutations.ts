import { trace } from "@opentelemetry/api";
import type { Recipe, RecipeIngredient } from "../types/index.js";
import {
  recipes,
  recipeIngredients,
  categories,
  ingredients,
  incrementRecipeIdCounter,
} from "../data/index.js";

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
    const newRecipe: Recipe = {
      id: String(incrementRecipeIdCounter()),
      ...input.recipe,
    };
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
      "recipe.created_id": newRecipe.id,
      "recipe.title": newRecipe.title,
      "recipe.category": category?.name || "Unknown",
      "recipe.difficulty": newRecipe.difficulty,
      "recipe.prep_time": newRecipe.prepTime,
      "recipe.cook_time": newRecipe.cookTime,
      "recipe.total_time": newRecipe.prepTime + newRecipe.cookTime,
      "recipe.servings": newRecipe.servings,
      "recipe.ingredient_count": input.ingredients.length,
      "recipe.ingredient_categories": ingredientCategories.join(","),
    });

    return newRecipe;
  },

  updateRecipe: (
    _: unknown,
    { id, recipe }: { id: string; recipe: Omit<Recipe, "id"> },
  ) => {
    const activeSpan = trace.getActiveSpan();
    const index = recipes.findIndex((r) => r.id === id);

    if (index === -1) {
      activeSpan?.setAttributes({
        "recipe.id": id,
        "recipe.found": false,
      });
      return null;
    }

    const oldRecipe = recipes[index];
    const updatedRecipe = { id, ...recipe };
    recipes[index] = updatedRecipe;

    const fieldsChanged = [];
    if (oldRecipe.title !== updatedRecipe.title) fieldsChanged.push("title");
    if (oldRecipe.description !== updatedRecipe.description)
      fieldsChanged.push("description");
    if (oldRecipe.prepTime !== updatedRecipe.prepTime)
      fieldsChanged.push("prepTime");
    if (oldRecipe.cookTime !== updatedRecipe.cookTime)
      fieldsChanged.push("cookTime");
    if (oldRecipe.difficulty !== updatedRecipe.difficulty)
      fieldsChanged.push("difficulty");
    if (oldRecipe.servings !== updatedRecipe.servings)
      fieldsChanged.push("servings");
    if (oldRecipe.categoryId !== updatedRecipe.categoryId)
      fieldsChanged.push("categoryId");

    const category = categories.find((c) => c.id === updatedRecipe.categoryId);

    activeSpan?.setAttributes({
      "recipe.id": id,
      "recipe.found": true,
      "recipe.title": updatedRecipe.title,
      "recipe.category": category?.name || "Unknown",
      "recipe.fields_changed": fieldsChanged.join(","),
      "recipe.fields_changed_count": fieldsChanged.length,
      "recipe.category_changed":
        oldRecipe.categoryId !== updatedRecipe.categoryId,
      "recipe.difficulty_changed":
        oldRecipe.difficulty !== updatedRecipe.difficulty,
    });

    return recipes[index];
  },

  deleteRecipe: (_: unknown, { id }: { id: string }) => {
    const activeSpan = trace.getActiveSpan();
    const index = recipes.findIndex((r) => r.id === id);

    if (index === -1) {
      activeSpan?.setAttributes({
        "recipe.deleted_id": id,
        "recipe.found": false,
        "recipe.deletion_success": false,
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
    const ingredientRelationshipsDeleted = ingIndexes.length;
    ingIndexes.forEach((idx) => recipeIngredients.splice(idx, 1));

    activeSpan?.setAttributes({
      "recipe.deleted_id": id,
      "recipe.title": recipe.title,
      "recipe.category": category?.name || "Unknown",
      "recipe.found": true,
      "recipe.deletion_success": true,
      "recipe.ingredient_relationships_deleted": ingredientRelationshipsDeleted,
    });

    return true;
  },
};
