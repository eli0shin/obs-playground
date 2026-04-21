import { Router, type Request, type Response } from "express";
import { trace } from "@opentelemetry/api";
import { graphqlRequest } from "@obs-playground/graphql-client";
import { ingredientPrices } from "../data";
import type { GraphQLRecipe } from "../types";
import { logger } from "../otel";

const router = Router();

router.get("/meal-plan/estimate", async (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const requestStart = Date.now();
  const { recipeIds } = req.query;

  if (!recipeIds || typeof recipeIds !== "string") {
    logger.warn("Meal plan missing recipeIds query parameter", {
      "meal_plan.query_param_present": Boolean(recipeIds),
      "meal_plan.query_param_type": typeof recipeIds,
    });
    return res
      .status(400)
      .json({ error: "recipeIds query parameter is required" });
  }

  const idsArray = recipeIds.split(",");

  activeSpan?.setAttributes({
    "meal_plan.recipe_ids": recipeIds,
    "meal_plan.recipe_count": idsArray.length,
  });

  logger.info("Meal plan request received", {
    "meal_plan.recipe_ids": idsArray,
    "meal_plan.recipe_count": idsArray.length,
  });

  const graphqlStart = Date.now();
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
  const selectedRecipes = allRecipes.filter((r) => idsArray.includes(r.id));
  const foundIds = selectedRecipes.map((r) => r.id);
  const missingIds = idsArray.filter((id) => !foundIds.includes(id));

  logger.info("Meal plan recipes fetched from GraphQL", {
    "meal_plan.requested_count": idsArray.length,
    "meal_plan.found_count": selectedRecipes.length,
    "meal_plan.missing_count": missingIds.length,
    "graphql.duration_ms": Date.now() - graphqlStart,
  });

  if (missingIds.length > 0) {
    logger.warn("Meal plan has missing recipes", {
      "meal_plan.requested_ids": idsArray,
      "meal_plan.missing_ids": missingIds,
      "meal_plan.found_ids": foundIds,
    });
  }

  // Calculate cost for each recipe
  const recipeCosts = selectedRecipes.map((recipe) => {
    let recipeCost = 0;

    recipe.ingredients.forEach(({ ingredient, quantity }) => {
      const pricePerUnit = ingredientPrices[ingredient.id] || 0;
      recipeCost += pricePerUnit * quantity;
    });

    return {
      recipeId: recipe.id,
      title: recipe.title,
      cost: recipeCost,
    };
  });

  const totalWeeklyCost = recipeCosts.reduce((sum, r) => sum + r.cost, 0);
  const averageMealCost = totalWeeklyCost / recipeCosts.length;
  const recipeTitles = recipeCosts.map((r) => r.title).join(",");
  const costs = recipeCosts.map((r) => r.cost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const costPerDay = totalWeeklyCost / 7;

  logger.info("Meal plan costs calculated", {
    "meal_plan.meal_count": recipeCosts.length,
    "meal_plan.total_weekly_cost": totalWeeklyCost,
    "meal_plan.average_meal_cost": averageMealCost,
    "meal_plan.cost_range_min": minCost,
    "meal_plan.cost_range_max": maxCost,
  });

  activeSpan?.setAttributes({
    "meal_plan.recipe_titles": recipeTitles,
    "meal_plan.total_weekly_cost": totalWeeklyCost,
    "meal_plan.cost_per_day": costPerDay,
    "meal_plan.average_meal_cost": averageMealCost,
    "meal_plan.cost_range_min": minCost,
    "meal_plan.cost_range_max": maxCost,
    "meal_plan.meal_count": recipeCosts.length,
  });

  logger.info("Meal plan estimate generated", {
    "meal_plan.total_weekly_cost": totalWeeklyCost,
    "meal_plan.cost_per_day": costPerDay,
    "meal_plan.average_meal_cost": averageMealCost,
    "meal_plan.meal_count": recipeCosts.length,
    "meal_plan.duration_ms": Date.now() - requestStart,
  });

  res.json({
    recipes: recipeCosts,
    totalWeeklyCost,
    averageMealCost,
    mealCount: recipeCosts.length,
  });
});

export default router;
