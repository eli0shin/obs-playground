import { Router, Request, Response } from "express";
import { trace } from "@opentelemetry/api";
import { graphqlRequest } from "@obs-playground/graphql-client";
import { ingredientNutrition } from "../data.js";
import type {
  BatchNutritionRequest,
  RecipeNutrition,
  GraphQLRecipe,
} from "../types.js";

const router = Router();

router.post("/batch/nutrition", async (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { recipeIds } = req.body as BatchNutritionRequest;

  activeSpan?.setAttributes({
    "batch_nutrition.recipe_ids": recipeIds,
    "batch_nutrition.recipe_count": recipeIds?.length || 0,
  });

  if (!recipeIds || !Array.isArray(recipeIds)) {
    return res.status(400).json({ error: "recipeIds array is required" });
  }

  const { recipes: allRecipes } = await graphqlRequest<{
    recipes: GraphQLRecipe[];
  }>(`
    query GetAllRecipes {
      recipes {
        id
        title
        ingredients {
          ingredient {
            id
            name
            unit
          }
          quantity
        }
      }
    }
  `);
  const selectedRecipes = allRecipes.filter((r) => recipeIds.includes(r.id));

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

  activeSpan?.setAttributes({
    "batch_nutrition.recipe_titles": recipeTitles,
    "batch_nutrition.recipes_analyzed": recipeNutritionData.length,
    "batch_nutrition.total_calories": totalCalories,
    "batch_nutrition.total_protein": totalProtein,
    "batch_nutrition.total_fat": totalFat,
    "batch_nutrition.total_carbs": totalCarbs,
    "batch_nutrition.avg_calories_per_recipe": avgCalories,
    "batch_nutrition.avg_protein_per_recipe": avgProtein,
    "batch_nutrition.calories_range_min": Math.min(...calories),
    "batch_nutrition.calories_range_max": Math.max(...calories),
  });

  res.json({
    recipes: recipeNutritionData,
    count: recipeNutritionData.length,
  });
});

export default router;
