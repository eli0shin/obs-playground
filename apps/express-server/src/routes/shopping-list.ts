import { Router, type Request, type Response } from "express";
import { trace } from "@opentelemetry/api";
import { graphqlRequest } from "@obs-playground/graphql-client";
import { ingredientPrices, ingredientInventory } from "../data";
import type { ShoppingListItem, GraphQLRecipe } from "../types";
import { shoppingListSchema } from "../schemas";
import { logger } from "../otel";

const router = Router();

router.post("/shopping-list/generate", async (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const requestStart = Date.now();
  const parsed = shoppingListSchema.safeParse(req.body);

  if (!parsed.success) {
    logger.warn("Shopping list validation failed", {
      err: parsed.error,
      "shopping_list.issue_count": parsed.error.issues.length,
    });
    activeSpan?.recordException(parsed.error);
    return res.status(400).json({ error: parsed.error.issues });
  }

  const { recipeIds, servings = {} } = parsed.data;
  const hasCustomServings = Object.keys(servings).length > 0;

  // Capture inputs
  activeSpan?.setAttributes({
    "shopping_list.recipe_ids": JSON.stringify(recipeIds),
    "shopping_list.recipe_count": recipeIds.length,
    "shopping_list.has_custom_servings": hasCustomServings,
  });

  logger.info("Shopping list request received", {
    "shopping_list.recipe_ids": recipeIds,
    "shopping_list.recipe_count": recipeIds.length,
    "shopping_list.has_custom_servings": hasCustomServings,
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
  const selectedRecipes = allRecipes.filter((r) => recipeIds.includes(r.id));
  const foundIds = selectedRecipes.map((r) => r.id);
  const missingIds = recipeIds.filter((id) => !foundIds.includes(id));

  logger.info("Shopping list recipes fetched from GraphQL", {
    "shopping_list.requested_count": recipeIds.length,
    "shopping_list.found_count": selectedRecipes.length,
    "shopping_list.missing_count": missingIds.length,
    "graphql.duration_ms": Date.now() - graphqlStart,
  });

  if (missingIds.length > 0) {
    logger.warn("Shopping list has missing recipes", {
      "shopping_list.requested_ids": recipeIds,
      "shopping_list.missing_ids": missingIds,
      "shopping_list.found_ids": foundIds,
    });
  }

  activeSpan?.setAttributes({
    "shopping_list.recipes_found": selectedRecipes.length,
    "shopping_list.recipes_missing": recipeIds.length - selectedRecipes.length,
  });

  // Aggregate ingredients
  const ingredientMap = new Map<
    string,
    { name: string; unit: string; quantity: number }
  >();

  let totalIngredientEntries = 0;
  selectedRecipes.forEach((recipe) => {
    const recipeServings = servings[recipe.id] ?? 1;

    recipe.ingredients.forEach(({ ingredient, quantity }) => {
      totalIngredientEntries += 1;
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

  logger.info("Shopping list ingredients aggregated", {
    "shopping_list.unique_ingredients": ingredientMap.size,
    "shopping_list.total_ingredient_entries": totalIngredientEntries,
    "shopping_list.recipe_count": selectedRecipes.length,
  });

  // Add pricing and stock info
  const shoppingList: ShoppingListItem[] = [];
  let totalCost = 0;
  const outOfStock: string[] = [];
  const outOfStockIds: string[] = [];
  let pricedCount = 0;

  ingredientMap.forEach((item, ingredientId) => {
    const pricePerUnit = ingredientPrices[ingredientId] ?? 0;
    const inventory = ingredientInventory[ingredientId];
    const itemTotalCost = pricePerUnit * item.quantity;

    if (pricePerUnit > 0) {
      pricedCount += 1;
    }

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
      outOfStockIds.push(ingredientId);
    }
  });

  const inStockCount = shoppingList.length - outOfStock.length;

  logger.info("Shopping list prices and inventory applied", {
    "shopping_list.ingredient_count": shoppingList.length,
    "shopping_list.priced_count": pricedCount,
    "shopping_list.in_stock_count": inStockCount,
    "shopping_list.out_of_stock_count": outOfStock.length,
  });

  if (outOfStock.length > 0) {
    logger.warn("Shopping list has out-of-stock items", {
      "shopping_list.out_of_stock_names": outOfStock,
      "shopping_list.out_of_stock_ids": outOfStockIds,
      "shopping_list.out_of_stock_count": outOfStock.length,
    });
  }

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

  logger.info("Shopping list generated", {
    "shopping_list.total_cost": totalCost,
    "shopping_list.cost_per_serving": costPerServing,
    "shopping_list.total_items": shoppingList.length,
    "shopping_list.out_of_stock_count": outOfStock.length,
    "shopping_list.most_expensive_ingredient": mostExpensiveItem?.name,
    "shopping_list.most_expensive_ingredient_cost":
      mostExpensiveItem?.totalCost,
    "shopping_list.duration_ms": Date.now() - requestStart,
  });

  res.json({
    items: shoppingList,
    totalCost,
    outOfStock,
    recipeCount: selectedRecipes.length,
  });
});

export default router;
