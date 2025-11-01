import { Router, Request, Response } from "express";
import { trace } from "@opentelemetry/api";
import { fetchRecipes } from "../graphql-client.js";
import { ingredientPrices, ingredientInventory } from "../data.js";
import type { ShoppingListRequest, ShoppingListItem } from "../types.js";

const router = Router();

router.post("/shopping-list/generate", async (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { recipeIds, servings = {} } = req.body as ShoppingListRequest;

  // Capture inputs
  activeSpan?.setAttributes({
    "shopping_list.recipe_ids": JSON.stringify(recipeIds),
    "shopping_list.recipe_count": recipeIds?.length || 0,
    "shopping_list.has_custom_servings": Object.keys(servings).length > 0,
  });

  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
    return res.status(400).json({ error: "recipeIds array is required" });
  }

  const allRecipes = await fetchRecipes();
  const selectedRecipes = allRecipes.filter((r) => recipeIds.includes(r.id));

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
    const recipeServings = servings[recipe.id] || 1;

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
    const pricePerUnit = ingredientPrices[ingredientId] || 0;
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
    selectedRecipes.reduce((sum, r) => sum + (servings[r.id] || 1), 0);
  const mostExpensiveItem = shoppingList.reduce(
    (max, item) => (item.totalCost > (max?.totalCost || 0) ? item : max),
    shoppingList[0],
  );

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
