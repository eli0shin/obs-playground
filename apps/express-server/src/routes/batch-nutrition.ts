import { Router, type Request, type Response } from "express";
import { trace } from "@opentelemetry/api";
import {
  graphqlRequest,
  AllRecipesForAggregationDocument,
} from "@obs-playground/graphql-client";
import { ingredientNutrition } from "../data";
import type { RecipeNutrition } from "../types";
import { batchNutritionSchema } from "../schemas";
import { logger } from "../otel";

const router = Router();

router.post("/batch/nutrition", async (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const requestStart = Date.now();
  const parsed = batchNutritionSchema.safeParse(req.body);

  if (!parsed.success) {
    logger.warn("Batch nutrition validation failed", {
      err: parsed.error,
      "batch_nutrition.issue_count": parsed.error.issues.length,
    });
    activeSpan?.recordException(parsed.error);
    return res.status(400).json({ error: parsed.error.issues });
  }

  const { recipeIds } = parsed.data;

  activeSpan?.setAttributes({
    "batch_nutrition.recipe_ids": recipeIds,
    "batch_nutrition.recipe_count": recipeIds.length,
  });

  logger.info("Batch nutrition request received", {
    "batch_nutrition.recipe_ids": recipeIds,
    "batch_nutrition.recipe_count": recipeIds.length,
  });

  const graphqlStart = Date.now();
  const { recipes: allRecipes } = await graphqlRequest(
    AllRecipesForAggregationDocument,
  );
  const selectedRecipes = allRecipes.filter((r) => recipeIds.includes(r.id));
  const foundIds = selectedRecipes.map((r) => r.id);
  const missingIds = recipeIds.filter((id) => !foundIds.includes(id));

  logger.info("Batch nutrition recipes fetched from GraphQL", {
    "batch_nutrition.requested_count": recipeIds.length,
    "batch_nutrition.found_count": selectedRecipes.length,
    "batch_nutrition.missing_count": missingIds.length,
    "graphql.duration_ms": Date.now() - graphqlStart,
  });

  if (missingIds.length > 0) {
    logger.warn("Batch nutrition has missing recipes", {
      "batch_nutrition.requested_ids": recipeIds,
      "batch_nutrition.missing_ids": missingIds,
      "batch_nutrition.found_ids": foundIds,
    });
  }

  // Calculate nutrition for each recipe
  const recipeNutritionData: RecipeNutrition[] = selectedRecipes.map(
    (recipe) => {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalFat = 0;
      let totalCarbs = 0;

      recipe.ingredients.forEach(({ ingredient, quantity }) => {
        const nutrition = ingredientNutrition[ingredient.id];
        if (nutrition) {
          totalCalories += nutrition.calories * quantity;
          totalProtein += nutrition.protein * quantity;
          totalFat += nutrition.fat * quantity;
          totalCarbs += nutrition.carbs * quantity;
        }
      });

      return {
        recipeId: recipe.id,
        title: recipe.title,
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
      };
    },
  );

  const totalCalories = recipeNutritionData.reduce(
    (sum, r) => sum + r.calories,
    0,
  );
  const totalProtein = recipeNutritionData.reduce(
    (sum, r) => sum + r.protein,
    0,
  );
  const totalFat = recipeNutritionData.reduce((sum, r) => sum + r.fat, 0);
  const totalCarbs = recipeNutritionData.reduce((sum, r) => sum + r.carbs, 0);
  const recipeTitles = recipeNutritionData.map((r) => r.title).join(",");
  const calories = recipeNutritionData.map((r) => r.calories);
  const avgCalories = totalCalories / recipeNutritionData.length;
  const avgProtein = totalProtein / recipeNutritionData.length;
  const minCalories = Math.min(...calories);
  const maxCalories = Math.max(...calories);

  logger.info("Batch nutrition aggregated", {
    "batch_nutrition.recipes_analyzed": recipeNutritionData.length,
    "batch_nutrition.total_calories": totalCalories,
    "batch_nutrition.total_protein": totalProtein,
    "batch_nutrition.total_fat": totalFat,
    "batch_nutrition.total_carbs": totalCarbs,
    "batch_nutrition.avg_calories_per_recipe": avgCalories,
    "batch_nutrition.calories_range_min": minCalories,
    "batch_nutrition.calories_range_max": maxCalories,
  });

  activeSpan?.setAttributes({
    "batch_nutrition.recipe_titles": recipeTitles,
    "batch_nutrition.recipes_analyzed": recipeNutritionData.length,
    "batch_nutrition.total_calories": totalCalories,
    "batch_nutrition.total_protein": totalProtein,
    "batch_nutrition.total_fat": totalFat,
    "batch_nutrition.total_carbs": totalCarbs,
    "batch_nutrition.avg_calories_per_recipe": avgCalories,
    "batch_nutrition.avg_protein_per_recipe": avgProtein,
    "batch_nutrition.calories_range_min": minCalories,
    "batch_nutrition.calories_range_max": maxCalories,
  });

  logger.info("Batch nutrition analysis complete", {
    "batch_nutrition.recipes_analyzed": recipeNutritionData.length,
    "batch_nutrition.total_calories": totalCalories,
    "batch_nutrition.avg_calories_per_recipe": avgCalories,
    "batch_nutrition.duration_ms": Date.now() - requestStart,
  });

  res.json({
    recipes: recipeNutritionData,
    count: recipeNutritionData.length,
  });
});

export default router;
