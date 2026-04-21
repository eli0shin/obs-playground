import { trace } from "@opentelemetry/api";
import { getExpressUrl } from "@obs-playground/env";
import type { IngredientCost } from "../types/index.js";
import {
  recipes,
  recipeIngredients,
  categories,
  ingredients,
} from "../data/index.js";
import { getOperationSpan } from "../utils/otel.js";
import { pricesResponseSchema, nutritionResponseSchema } from "../schemas.js";
import { logger } from "../otel.js";

export const Query = {
  recipe: (_: unknown, { id }: { id: string }) => {
    const operationSpan = getOperationSpan();

    operationSpan?.setAttribute("resolver.recipe.id", id);

    return recipes.find((r) => r.id === id);
  },

  recipeWithCost: async (_: unknown, { id }: { id: string }) => {
    const activeSpan = trace.getActiveSpan();
    const operationSpan = getOperationSpan();
    const resolverStart = Date.now();

    activeSpan?.setAttributes({
      "recipe.id": id,
    });

    operationSpan?.setAttributes({
      "resolver.recipe_with_cost.id": id,
      "resolver.recipe_with_cost.includes_pricing": true,
    });

    logger.info("Resolving recipeWithCost", {
      "recipe.id": id,
    });

    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) {
      activeSpan?.setAttribute("recipe.found", false);
      operationSpan?.setAttribute("resolver.recipe_with_cost.found", false);
      logger.warn("Recipe not found in recipeWithCost", {
        "recipe.id": id,
      });
      return null;
    }

    const category = categories.find((c) => c.id === recipe.categoryId);

    activeSpan?.setAttributes({
      "recipe.title": recipe.title,
      "recipe.category": category?.name || "Unknown",
      "recipe.difficulty": recipe.difficulty,
      "recipe.prep_time": recipe.prepTime,
      "recipe.cook_time": recipe.cookTime,
      "recipe.total_time": recipe.prepTime + recipe.cookTime,
      "recipe.servings": recipe.servings,
    });

    const recipeIngs = recipeIngredients.filter((ri) => ri.recipeId === id);
    const ingredientIds = recipeIngs.map((ri) => ri.ingredientId);

    activeSpan?.setAttributes({
      "recipe.ingredient_count": recipeIngs.length,
      "recipe.ingredient_ids": ingredientIds.join(","),
    });

    logger.info("Fetching ingredient prices from Express", {
      "recipe.id": id,
      "recipe.title": recipe.title,
      "recipe.ingredient_count": recipeIngs.length,
      "recipe.ingredient_ids": ingredientIds,
    });

    const expressStart = Date.now();
    const response = await fetch(
      `${getExpressUrl()}/ingredients/prices?ids=${ingredientIds.join(",")}`,
    );
    const pricesResult = pricesResponseSchema.safeParse(await response.json());
    const prices = pricesResult.success ? pricesResult.data : {};

    logger.info("Fetched ingredient prices from Express", {
      "recipe.id": id,
      "pricing.ingredient_count": Object.keys(prices).length,
      "pricing.parse_success": pricesResult.success,
      "express.duration_ms": Date.now() - expressStart,
    });

    const ingredientCosts: IngredientCost[] = recipeIngs.flatMap((ri) => {
      const ingredient = ingredients.find((i) => i.id === ri.ingredientId);
      if (!ingredient) return [];

      const pricePerUnit = prices[ri.ingredientId] ?? 0;
      const totalCost = pricePerUnit * ri.quantity;

      return [
        {
          ingredientId: ri.ingredientId,
          name: ingredient.name,
          quantity: ri.quantity,
          unit: ingredient.unit,
          pricePerUnit,
          totalCost,
        },
      ];
    });

    const totalCost = ingredientCosts.reduce(
      (sum, ic) => sum + ic.totalCost,
      0,
    );
    const costPerServing = totalCost / recipe.servings;

    activeSpan?.setAttributes({
      "recipe.total_cost": totalCost,
      "recipe.cost_per_serving": costPerServing,
    });

    operationSpan?.setAttributes({
      "resolver.recipe_with_cost.total_cost": totalCost,
      "resolver.recipe_with_cost.cost_per_serving": costPerServing,
      "resolver.recipe_with_cost.ingredient_count": ingredientCosts.length,
    });

    logger.info("Resolved recipeWithCost", {
      "recipe.id": id,
      "recipe.title": recipe.title,
      "recipe.total_cost": totalCost,
      "recipe.cost_per_serving": costPerServing,
      "recipe.ingredient_count": ingredientCosts.length,
      "resolver.duration_ms": Date.now() - resolverStart,
    });

    return {
      ...recipe,
      ingredientCosts,
      totalCost,
    };
  },

  recipeWithNutrition: async (_: unknown, { id }: { id: string }) => {
    const activeSpan = trace.getActiveSpan();
    const resolverStart = Date.now();

    activeSpan?.setAttributes({
      "recipe.id": id,
    });

    logger.info("Resolving recipeWithNutrition", {
      "recipe.id": id,
    });

    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) {
      activeSpan?.setAttribute("recipe.found", false);
      logger.warn("Recipe not found in recipeWithNutrition", {
        "recipe.id": id,
      });
      return null;
    }

    const category = categories.find((c) => c.id === recipe.categoryId);

    activeSpan?.setAttributes({
      "recipe.title": recipe.title,
      "recipe.category": category?.name || "Unknown",
      "recipe.difficulty": recipe.difficulty,
      "recipe.prep_time": recipe.prepTime,
      "recipe.cook_time": recipe.cookTime,
      "recipe.total_time": recipe.prepTime + recipe.cookTime,
      "recipe.servings": recipe.servings,
    });

    const recipeIngs = recipeIngredients.filter((ri) => ri.recipeId === id);

    activeSpan?.setAttributes({
      "recipe.ingredient_count": recipeIngs.length,
      "nutrition.parallel_requests": recipeIngs.length,
    });

    logger.info("Fetching nutrition data from Express in parallel", {
      "recipe.id": id,
      "recipe.title": recipe.title,
      "nutrition.parallel_requests": recipeIngs.length,
    });

    const expressStart = Date.now();
    const nutritionPromises = recipeIngs.map(async (ri) => {
      const response = await fetch(
        `${getExpressUrl()}/nutrition/ingredient/${ri.ingredientId}`,
      );
      const result = nutritionResponseSchema.safeParse(await response.json());
      const nutrition = result.success
        ? result.data
        : { calories: 0, protein: 0, fat: 0, carbs: 0 };

      return {
        calories: nutrition.calories * ri.quantity,
        protein: nutrition.protein * ri.quantity,
        fat: nutrition.fat * ri.quantity,
        carbs: nutrition.carbs * ri.quantity,
      };
    });

    const nutritionData = await Promise.all(nutritionPromises);

    logger.info("Fetched nutrition data from Express", {
      "recipe.id": id,
      "nutrition.parallel_requests": recipeIngs.length,
      "nutrition.responses_received": nutritionData.length,
      "express.duration_ms": Date.now() - expressStart,
    });

    const totalNutrition = nutritionData.reduce(
      (sum, n) => ({
        calories: sum.calories + n.calories,
        protein: sum.protein + n.protein,
        fat: sum.fat + n.fat,
        carbs: sum.carbs + n.carbs,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 },
    );

    const caloriesPerServing = totalNutrition.calories / recipe.servings;
    const proteinPerServing = totalNutrition.protein / recipe.servings;
    const fatPerServing = totalNutrition.fat / recipe.servings;
    const carbsPerServing = totalNutrition.carbs / recipe.servings;

    activeSpan?.setAttributes({
      "nutrition.total_calories": totalNutrition.calories,
      "nutrition.total_protein": totalNutrition.protein,
      "nutrition.total_fat": totalNutrition.fat,
      "nutrition.total_carbs": totalNutrition.carbs,
      "nutrition.calories_per_serving": caloriesPerServing,
      "nutrition.protein_per_serving": proteinPerServing,
      "nutrition.fat_per_serving": fatPerServing,
      "nutrition.carbs_per_serving": carbsPerServing,
    });

    logger.info("Resolved recipeWithNutrition", {
      "recipe.id": id,
      "recipe.title": recipe.title,
      "nutrition.total_calories": totalNutrition.calories,
      "nutrition.calories_per_serving": caloriesPerServing,
      "nutrition.protein_per_serving": proteinPerServing,
      "resolver.duration_ms": Date.now() - resolverStart,
    });

    return {
      ...recipe,
      ...totalNutrition,
    };
  },

  recipes: (
    _: unknown,
    { categoryId, difficulty }: { categoryId?: string; difficulty?: string },
  ) => {
    const activeSpan = trace.getActiveSpan();
    const filtersApplied = [];

    let filtered = recipes;
    if (categoryId) {
      filtered = filtered.filter((r) => r.categoryId === categoryId);
      filtersApplied.push("category");
    }
    if (difficulty) {
      filtered = filtered.filter((r) => r.difficulty === difficulty);
      filtersApplied.push("difficulty");
    }

    const category = categoryId
      ? categories.find((c) => c.id === categoryId)
      : undefined;
    activeSpan?.setAttributes({
      "filter.applied_count": filtersApplied.length,
      "filter.applied": filtersApplied,
      "filter.category_id": categoryId,
      "filter.category_name": category?.name,
      "filter.difficulty": difficulty,
      "recipes.total_count": recipes.length,
      "recipes.result_count": filtered.length,
      "recipes.filter_match_rate": filtered.length / recipes.length,
    });

    return filtered;
  },

  searchRecipes: (_: unknown, { query }: { query: string }) => {
    const activeSpan = trace.getActiveSpan();
    const lowerQuery = query.toLowerCase();

    const results = recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(lowerQuery) ||
        r.description.toLowerCase().includes(lowerQuery),
    );

    const titleMatches = results.filter((r) =>
      r.title.toLowerCase().includes(lowerQuery),
    ).length;
    const descriptionMatches = results.filter((r) =>
      r.description.toLowerCase().includes(lowerQuery),
    ).length;

    activeSpan?.setAttributes({
      "search.query": lowerQuery,
      "search.result_count": results.length,
      "search.matched_title_count": titleMatches,
      "search.matched_description_count": descriptionMatches,
      "search.total_recipes": recipes.length,
      "search.match_rate": results.length / recipes.length,
    });

    return results;
  },

  categories: () => categories,

  ingredients: () => ingredients,
};
