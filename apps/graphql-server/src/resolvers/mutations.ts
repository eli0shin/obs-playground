import { trace } from "@opentelemetry/api";
import { getExpressUrl } from "@obs-playground/env";
import type {
  CreateRecipeInput,
  MutationResolvers as MutationResolverMap,
  RecipeInput,
} from "../generated/resolvers-types.js";
import { categories, ingredients } from "../data/index.js";
import { toGraphqlRecipe } from "./fields.js";
import { expressRecipeSingleSchema } from "../schemas.js";
import { logger } from "../otel.js";

export const Mutation = {
  createRecipe: async (
    _: unknown,
    {
      input,
    }: {
      input: CreateRecipeInput;
    },
  ) => {
    const activeSpan = trace.getActiveSpan();

    const response = await fetch(`${getExpressUrl()}/recipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input.recipe,
        ingredients: input.ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error("Failed to create recipe via Express", { error });
      throw new Error(`Failed to create recipe: ${response.status}`);
    }

    const created = expressRecipeSingleSchema.parse(await response.json());

    const category = categories.find((c) => c.id === created.categoryId);
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
      "recipe.id": created.id,
      "recipe.title": created.title,
      "recipe.category": category?.name || "Unknown",
      "recipe.difficulty": created.difficulty,
      "recipe.prep_time": created.prepTime,
      "recipe.cook_time": created.cookTime,
      "recipe.total_time": created.prepTime + created.cookTime,
      "recipe.servings": created.servings,
      "recipe.ingredient_count": input.ingredients.length,
      "recipe.ingredient_categories": ingredientCategories,
    });

    logger.info("Recipe created", {
      "recipe.id": created.id,
      "recipe.title": created.title,
      "recipe.category": category?.name,
      "recipe.difficulty": created.difficulty,
      "recipe.servings": created.servings,
      "recipe.ingredient_count": input.ingredients.length,
      "recipe.ingredient_categories": ingredientCategories,
    });

    return toGraphqlRecipe(created);
  },

  updateRecipe: async (
    _: unknown,
    { id, recipe }: { id: string; recipe: RecipeInput },
  ) => {
    const activeSpan = trace.getActiveSpan();
    activeSpan?.setAttributes({
      "recipe.id": id,
    });

    const response = await fetch(`${getExpressUrl()}/recipes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipe),
    });

    if (response.status === 404) {
      logger.warn("Recipe update target not found", {
        "recipe.id": id,
      });
      return null;
    }

    if (!response.ok) {
      const error = await response.text();
      logger.error("Failed to update recipe via Express", { error });
      throw new Error(`Failed to update recipe: ${response.status}`);
    }

    const updated = expressRecipeSingleSchema.parse(await response.json());

    const category = categories.find((c) => c.id === updated.categoryId);

    activeSpan?.setAttributes({
      "recipe.title": updated.title,
      "recipe.category": category?.name,
    });

    logger.info("Recipe updated", {
      "recipe.id": id,
      "recipe.title": updated.title,
    });

    return toGraphqlRecipe(updated);
  },

  deleteRecipe: async (_: unknown, { id }: { id: string }) => {
    const activeSpan = trace.getActiveSpan();
    activeSpan?.setAttributes({
      "recipe.id": id,
    });

    const response = await fetch(`${getExpressUrl()}/recipes/${id}`, {
      method: "DELETE",
    });

    if (response.status === 404) {
      logger.warn("Recipe deletion target not found", {
        "recipe.id": id,
      });
      return false;
    }

    activeSpan?.setAttributes({
      "recipe.deleted": true,
    });

    logger.info("Recipe deleted", {
      "recipe.id": id,
    });

    return true;
  },
} satisfies MutationResolverMap;
