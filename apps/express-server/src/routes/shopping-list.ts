import { Router, type Request, type Response } from "express";
import { trace } from "@opentelemetry/api";
import {
  graphqlRequest,
  AllRecipesForAggregationDocument,
} from "@obs-playground/graphql-client";
import { ingredientPrices, ingredientInventory } from "../data";
import type { ShoppingListItem } from "../types";
import { shoppingListSchema } from "../schemas";
import { logger } from "../otel";

const router = Router();

router.post("/shopping-list/generate", async (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const parsed = shoppingListSchema.safeParse(req.body);

  if (!parsed.success) {
    logger.warn("Shopping list validation failed", { err: parsed.error });
    activeSpan?.recordException(parsed.error);
    return res.status(400).json({ error: parsed.error.issues });
  }

  const { recipeIds, servings = {} } = parsed.data;

  // Capture inputs
  activeSpan?.setAttributes({
    "shopping_list.recipe_ids": JSON.stringify(recipeIds),
    "shopping_list.recipe_count": recipeIds.length,
    "shopping_list.has_custom_servings": Object.keys(servings).length > 0,
  });

  const { recipes: allRecipes } = await graphqlRequest(
    AllRecipesForAggregationDocument,
  );
  const selectedRecipes = allRecipes.filter((r) => recipeIds.includes(r.id));
  logger.info("Shopping list recipes fetched from GraphQL", {
    requested: recipeIds.length,
    found: selectedRecipes.length,
  });

  activeSpan?.setAttributes({
    "shopping_list.recipes_found": selectedRecipes.length,
    "shopping_list.recipes_missing": recipeIds.length - selectedRecipes.length,
  });

  // Aggregate ingredients
  const ingredientMap = new Map<
    string,
    { name: string; unit: string; quantity: number }
  >();

  selectedRecipes.forEach((recipe) => {
    const recipeServings = servings[recipe.id] ?? 1;

    recipe.ingredients.forEach(({ ingredient, quantity }) => {
      const existing = ingredientMap.get(ingredient.id);
      const scaledQuantity = quantity * recipeServings;

      if (existing) {
        existing.quantity += scaledQuantity;
      } else {
        ingredientMap.set(ingredient.id, {
          name: ingredient.name,
          unit: ingredient.unit,
          quantity: scaledQuantity,
        });
      }
    });
  });

  // Add pricing and stock info
  const shoppingList: ShoppingListItem[] = [];
  let totalCost = 0;
  const outOfStock: string[] = [];

  ingredientMap.forEach((item, ingredientId) => {
    const pricePerUnit = ingredientPrices[ingredientId] ?? 0;
    const inventory = ingredientInventory[ingredientId];
    const itemTotalCost = pricePerUnit * item.quantity;

    shoppingList.push({
      ingredientId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      pricePerUnit,
      totalCost: itemTotalCost,
      inStock: inventory?.inStock ?? false,
    });

    totalCost += itemTotalCost;

    if (!inventory?.inStock) {
      outOfStock.push(item.name);
    }
  });

  // Calculate additional metrics
  const recipeTitles = selectedRecipes.map((r) => r.title).join(",");
  const costPerServing =
    totalCost /
    selectedRecipes.reduce((sum, r) => sum + (servings[r.id] ?? 1), 0);

  const mostExpensiveItem =
    shoppingList.length > 0
      ? shoppingList.reduce((max, item) =>
          item.totalCost > max.totalCost ? item : max,
        )
      : undefined;

  activeSpan?.setAttributes({
    "shopping_list.recipe_titles": recipeTitles,
    "shopping_list.total_items": shoppingList.length,
    "shopping_list.total_cost": totalCost,
    "shopping_list.cost_per_serving": costPerServing,
    "shopping_list.out_of_stock_count": outOfStock.length,
    "shopping_list.out_of_stock_names": outOfStock,
    "shopping_list.most_expensive_ingredient": mostExpensiveItem?.name,
    "shopping_list.most_expensive_ingredient_cost":
      mostExpensiveItem?.totalCost,
  });

  res.json({
    items: shoppingList,
    totalCost,
    outOfStock,
    recipeCount: selectedRecipes.length,
  });
});

export default router;
