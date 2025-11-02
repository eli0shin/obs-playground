import { trace } from "@opentelemetry/api";
import type { IngredientCost, NutritionData } from "../types/index.js";
import {
  recipes,
  recipeIngredients,
  categories,
  ingredients,
} from "../data/index.js";
import { getOperationSpan } from "../utils/otel.js";

const EXPRESS_URL = process.env.EXPRESS_URL || "http://localhost:3001";

export const Query = {
  recipe: (_: unknown, { id }: { id: string }) => {
    const operationSpan = getOperationSpan();

    operationSpan?.setAttribute("resolver.recipe.id", id);

    return recipes.find((r) => r.id === id);
  },

  recipeWithCost: async (_: unknown, { id }: { id: string }) => {
    const activeSpan = trace.getActiveSpan();
    const operationSpan = getOperationSpan();

    activeSpan?.setAttributes({
      "recipe.id": id,
    });

    operationSpan?.setAttributes({
      "resolver.recipe_with_cost.id": id,
      "resolver.recipe_with_cost.includes_pricing": true,
    });

    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) {
      activeSpan?.setAttribute("recipe.found", false);
      operationSpan?.setAttribute("resolver.recipe_with_cost.found", false);
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

    const response = await fetch(
      `${EXPRESS_URL}/ingredients/prices?ids=${ingredientIds.join(",")}`,
    );
    const prices = (await response.json()) as Record<string, number>;

    const ingredientCosts: IngredientCost[] = recipeIngs.map((ri) => {
      const ingredient = ingredients.find((i) => i.id === ri.ingredientId)!;
      const pricePerUnit = prices[ri.ingredientId] || 0;
      const totalCost = pricePerUnit * ri.quantity;

      return {
        ingredientId: ri.ingredientId,
        name: ingredient.name,
        quantity: ri.quantity,
        unit: ingredient.unit,
        pricePerUnit,
        totalCost,
      };
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

    return {
      ...recipe,
      ingredientCosts,
      totalCost,
    };
  },

  recipeWithNutrition: async (_: unknown, { id }: { id: string }) => {
    const activeSpan = trace.getActiveSpan();

    activeSpan?.setAttributes({
      "recipe.id": id,
    });

    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) {
      activeSpan?.setAttribute("recipe.found", false);
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

    const nutritionPromises = recipeIngs.map(async (ri) => {
      const response = await fetch(
        `${EXPRESS_URL}/nutrition/ingredient/${ri.ingredientId}`,
      );
      const nutrition = (await response.json()) as NutritionData;

      return {
        calories: nutrition.calories * ri.quantity,
        protein: nutrition.protein * ri.quantity,
        fat: nutrition.fat * ri.quantity,
        carbs: nutrition.carbs * ri.quantity,
      };
    });

    const nutritionData = await Promise.all(nutritionPromises);

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
