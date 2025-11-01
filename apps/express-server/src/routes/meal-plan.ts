import { Router, Request, Response } from "express";
import { trace } from "@opentelemetry/api";
import { graphqlRequest } from "@obs-playground/graphql-client";
import { ingredientPrices } from "../data.js";
import type { GraphQLRecipe } from "../types.js";

const router = Router();

router.get("/meal-plan/estimate", async (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { recipeIds } = req.query;

  if (!recipeIds || typeof recipeIds !== "string") {
    return res
      .status(400)
      .json({ error: "recipeIds query parameter is required" });
  }

  const idsArray = recipeIds.split(",");

  activeSpan?.setAttributes({
    "meal_plan.recipe_ids": recipeIds,
    "meal_plan.recipe_count": idsArray.length,
  });

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

  activeSpan?.setAttributes({
    "meal_plan.recipe_titles": recipeTitles,
    "meal_plan.total_weekly_cost": totalWeeklyCost,
    "meal_plan.cost_per_day": costPerDay,
    "meal_plan.average_meal_cost": averageMealCost,
    "meal_plan.cost_range_min": minCost,
    "meal_plan.cost_range_max": maxCost,
    "meal_plan.meal_count": recipeCosts.length,
  });

  res.json({
    recipes: recipeCosts,
    totalWeeklyCost,
    averageMealCost,
    mealCount: recipeCosts.length,
  });
});

export default router;
