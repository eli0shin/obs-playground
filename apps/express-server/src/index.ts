import './otel.js';
import express, { Request, Response, NextFunction } from 'express';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const app = express();
const PORT = process.env.PORT ?? 3001;
const GRAPHQL_URL = process.env.GRAPHQL_URL || 'http://localhost:4000/graphql';

app.use(express.json());

// Types
type NutritionData = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

type InventoryData = {
  inStock: boolean;
  quantity: number;
};

type ShoppingListRequest = {
  recipeIds: string[];
  servings?: Record<string, number>;
};

type ShoppingListItem = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
  inStock: boolean;
};

type GraphQLRecipe = {
  id: string;
  title: string;
  ingredients: Array<{
    ingredient: {
      id: string;
      name: string;
      unit: string;
    };
    quantity: number;
  }>;
};

type BatchNutritionRequest = {
  recipeIds: string[];
};

type RecipeNutrition = {
  recipeId: string;
  title: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

// In-memory data stores
const ingredientPrices: Record<string, number> = {
  '1': 0.5,   // Eggs - $0.50 per piece
  '2': 2.0,   // Flour - $2.00 per cup
  '3': 1.5,   // Milk - $1.50 per cup
  '4': 3.0,   // Sugar - $3.00 per cup
  '5': 0.3,   // Butter - $0.30 per tablespoon
  '6': 8.0,   // Chicken Breast - $8.00 per pound
  '7': 1.0,   // Rice - $1.00 per cup
  '8': 1.2,   // Tomato - $1.20 per piece
  '9': 0.8,   // Onion - $0.80 per piece
  '10': 0.2,  // Garlic - $0.20 per clove
};

const ingredientNutrition: Record<string, NutritionData> = {
  '1': { calories: 70, protein: 6, fat: 5, carbs: 0.5 },      // Eggs (per piece)
  '2': { calories: 455, protein: 13, fat: 1, carbs: 95 },     // Flour (per cup)
  '3': { calories: 150, protein: 8, fat: 8, carbs: 12 },      // Milk (per cup)
  '4': { calories: 774, protein: 0, fat: 0, carbs: 200 },     // Sugar (per cup)
  '5': { calories: 102, protein: 0.1, fat: 11.5, carbs: 0 },  // Butter (per tbsp)
  '6': { calories: 748, protein: 140, fat: 16, carbs: 0 },    // Chicken (per pound)
  '7': { calories: 206, protein: 4.3, fat: 0.4, carbs: 45 },  // Rice (per cup)
  '8': { calories: 22, protein: 1, fat: 0.2, carbs: 5 },      // Tomato (per piece)
  '9': { calories: 44, protein: 1.2, fat: 0.1, carbs: 10 },   // Onion (per piece)
  '10': { calories: 4, protein: 0.2, fat: 0, carbs: 1 },      // Garlic (per clove)
};

const ingredientInventory: Record<string, InventoryData> = {
  '1': { inStock: true, quantity: 100 },
  '2': { inStock: true, quantity: 50 },
  '3': { inStock: true, quantity: 30 },
  '4': { inStock: true, quantity: 20 },
  '5': { inStock: true, quantity: 60 },
  '6': { inStock: true, quantity: 25 },
  '7': { inStock: true, quantity: 40 },
  '8': { inStock: false, quantity: 0 },   // Out of stock
  '9': { inStock: true, quantity: 35 },
  '10': { inStock: true, quantity: 80 },
};

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Express API server is running!' });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// Pricing endpoints
app.get('/ingredients/:id/price', (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { id } = req.params;
  const price = ingredientPrices[id];

  if (activeSpan) {
    activeSpan.setAttributes({
      'ingredient.id': id,
      'ingredient.found': price !== undefined,
      'pricing.price': price || 0,
    });
  }

  if (price === undefined) {
    return res.status(404).json({ error: 'Ingredient not found' });
  }

  res.json({ ingredientId: id, price });
});

app.get('/ingredients/prices', (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { ids } = req.query;

  if (!ids) {
    // Return all prices
    if (activeSpan) {
      const allPrices = Object.values(ingredientPrices);
      activeSpan.setAttributes({
        'batch.type': 'all',
        'batch.ingredient_count': allPrices.length,
        'batch.price_range_min': Math.min(...allPrices),
        'batch.price_range_max': Math.max(...allPrices),
        'batch.price_range_avg': allPrices.reduce((a, b) => a + b, 0) / allPrices.length,
      });
    }
    return res.json(ingredientPrices);
  }

  // Return specific prices
  const idArray = (ids as string).split(',');
  const prices: Record<string, number> = {};
  const priceValues: number[] = [];

  idArray.forEach((id) => {
    if (ingredientPrices[id] !== undefined) {
      prices[id] = ingredientPrices[id];
      priceValues.push(ingredientPrices[id]);
    }
  });

  if (activeSpan) {
    activeSpan.setAttributes({
      'batch.type': 'filtered',
      'batch.ingredient_ids_requested': idArray.length,
      'batch.ingredient_ids_found': Object.keys(prices).length,
      'batch.ingredient_ids_missing': idArray.length - Object.keys(prices).length,
    });

    if (priceValues.length > 0) {
      activeSpan.setAttributes({
        'batch.price_range_min': Math.min(...priceValues),
        'batch.price_range_max': Math.max(...priceValues),
        'batch.price_range_avg': priceValues.reduce((a, b) => a + b, 0) / priceValues.length,
      });
    }
  }

  res.json(prices);
});

app.post('/ingredients/prices', (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const updates = req.body as Record<string, number>;
  const updateValues = Object.values(updates);

  Object.entries(updates).forEach(([id, price]) => {
    ingredientPrices[id] = price;
  });

  if (activeSpan) {
    activeSpan.setAttributes({
      'pricing.updated_count': Object.keys(updates).length,
      'pricing.updated_ids': Object.keys(updates).join(','),
    });

    if (updateValues.length > 0) {
      activeSpan.setAttributes({
        'pricing.price_range_min': Math.min(...updateValues),
        'pricing.price_range_max': Math.max(...updateValues),
        'pricing.price_range_avg': updateValues.reduce((a, b) => a + b, 0) / updateValues.length,
      });
    }
  }

  res.json({ success: true, updated: Object.keys(updates) });
});

// Nutrition endpoints
app.get('/nutrition/ingredient/:id', (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { id } = req.params;
  const nutrition = ingredientNutrition[id];

  if (activeSpan) {
    activeSpan.setAttributes({
      'ingredient.id': id,
      'ingredient.found': nutrition !== undefined,
    });

    if (nutrition) {
      activeSpan.setAttributes({
        'nutrition.calories': nutrition.calories,
        'nutrition.protein': nutrition.protein,
        'nutrition.fat': nutrition.fat,
        'nutrition.carbs': nutrition.carbs,
        'nutrition.total_macros': nutrition.protein + nutrition.fat + nutrition.carbs,
      });
    }
  }

  if (!nutrition) {
    return res.status(404).json({ error: 'Ingredient nutrition not found' });
  }

  res.json(nutrition);
});

// Inventory endpoints
app.get('/inventory/stock/:ingredientId', (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { ingredientId } = req.params;
  const inventory = ingredientInventory[ingredientId];

  if (activeSpan) {
    activeSpan.setAttributes({
      'inventory.ingredient_id': ingredientId,
      'inventory.found': inventory !== undefined,
    });

    if (inventory) {
      const stockLevel =
        inventory.quantity === 0
          ? 'out'
          : inventory.quantity < 10
          ? 'low'
          : inventory.quantity < 50
          ? 'medium'
          : 'high';

      activeSpan.setAttributes({
        'inventory.in_stock': inventory.inStock,
        'inventory.quantity': inventory.quantity,
        'inventory.stock_level': stockLevel,
      });
    }
  }

  if (!inventory) {
    return res.status(404).json({ error: 'Ingredient not found in inventory' });
  }

  res.json(inventory);
});

// Orchestration endpoints (Express → GraphQL)

// Shopping list generation
app.post('/shopping-list/generate', async (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { recipeIds, servings = {} } = req.body as ShoppingListRequest;

  // Capture inputs
  if (activeSpan) {
    activeSpan.setAttributes({
      'shopping_list.recipe_ids': JSON.stringify(recipeIds),
      'shopping_list.recipe_count': recipeIds?.length || 0,
      'shopping_list.has_custom_servings': Object.keys(servings).length > 0,
    });
  }

  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
    return res.status(400).json({ error: 'recipeIds array is required' });
  }

  // Call GraphQL to get recipe ingredients
  const graphqlQuery = {
    query: `
      query GetRecipes($ids: [ID!]!) {
        recipes: recipes {
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
    `,
  };

  const graphqlResponse = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graphqlQuery),
  });

  if (!graphqlResponse.ok) {
    throw new Error(`GraphQL request failed: ${graphqlResponse.status}`);
  }

  const { data, errors } = await graphqlResponse.json() as {
    data?: { recipes: GraphQLRecipe[] };
    errors?: unknown[];
  };

  if (errors || !data) {
    throw new Error('GraphQL returned errors or no data');
  }

  const allRecipes = data.recipes;
  const selectedRecipes = allRecipes.filter((r) => recipeIds.includes(r.id));

  if (activeSpan) {
    activeSpan.setAttributes({
      'shopping_list.recipes_found': selectedRecipes.length,
      'shopping_list.recipes_missing': recipeIds.length - selectedRecipes.length,
    });
  }

  // Aggregate ingredients
  const ingredientMap = new Map<string, { name: string; unit: string; quantity: number }>();

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
  const recipeTitles = selectedRecipes.map((r) => r.title).join(',');
  const costPerServing = totalCost / selectedRecipes.reduce((sum, r) => sum + (servings[r.id] || 1), 0);
  const mostExpensiveItem = shoppingList.reduce((max, item) =>
    item.totalCost > (max?.totalCost || 0) ? item : max, shoppingList[0]);

  if (activeSpan) {
    activeSpan.setAttributes({
      'shopping_list.recipe_titles': recipeTitles,
      'shopping_list.total_items': shoppingList.length,
      'shopping_list.total_cost': totalCost,
      'shopping_list.cost_per_serving': costPerServing,
      'shopping_list.out_of_stock_count': outOfStock.length,
      'shopping_list.out_of_stock_names': outOfStock.join(','),
      'shopping_list.has_out_of_stock': outOfStock.length > 0,
      'shopping_list.most_expensive_ingredient': mostExpensiveItem?.name || 'none',
      'shopping_list.most_expensive_ingredient_cost': mostExpensiveItem?.totalCost || 0,
    });
  }

  res.json({
    items: shoppingList,
    totalCost,
    outOfStock,
    recipeCount: selectedRecipes.length,
  });
});

// Meal plan cost estimation
app.get('/meal-plan/estimate', async (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { recipeIds } = req.query;

  if (!recipeIds || typeof recipeIds !== 'string') {
    if (activeSpan) {
      activeSpan.setAttribute('meal_plan.validation_failed', true);
    }
    return res.status(400).json({ error: 'recipeIds query parameter is required' });
  }

  const idsArray = recipeIds.split(',');

  if (activeSpan) {
    activeSpan.setAttributes({
      'meal_plan.recipe_ids': recipeIds,
      'meal_plan.recipe_count': idsArray.length,
    });
  }

  // Call GraphQL to get recipes
  const graphqlQuery = {
    query: `
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
    `,
  };

  const graphqlResponse = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graphqlQuery),
  });

  const { data } = await graphqlResponse.json() as { data: { recipes: GraphQLRecipe[] } };
  const selectedRecipes = data.recipes.filter((r) => idsArray.includes(r.id));

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
  const recipeTitles = recipeCosts.map((r) => r.title).join(',');
  const costs = recipeCosts.map((r) => r.cost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const costPerDay = totalWeeklyCost / 7;

  if (activeSpan) {
    activeSpan.setAttributes({
      'meal_plan.recipe_titles': recipeTitles,
      'meal_plan.total_weekly_cost': totalWeeklyCost,
      'meal_plan.cost_per_day': costPerDay,
      'meal_plan.average_meal_cost': averageMealCost,
      'meal_plan.cost_range_min': minCost,
      'meal_plan.cost_range_max': maxCost,
      'meal_plan.meal_count': recipeCosts.length,
    });
  }

  res.json({
    recipes: recipeCosts,
    totalWeeklyCost,
    averageMealCost,
    mealCount: recipeCosts.length,
  });
});

// Batch nutrition analysis
app.post('/batch/nutrition', async (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { recipeIds } = req.body as BatchNutritionRequest;

  if (activeSpan) {
    activeSpan.setAttributes({
      'batch_nutrition.recipe_ids': JSON.stringify(recipeIds),
      'batch_nutrition.recipe_count': recipeIds?.length || 0,
    });
  }

  if (!recipeIds || !Array.isArray(recipeIds)) {
    return res.status(400).json({ error: 'recipeIds array is required' });
  }

  // Call GraphQL to get recipes
  const graphqlQuery = {
    query: `
      query GetAllRecipes {
        recipes {
          id
          title
          ingredients {
            ingredient {
              id
            }
            quantity
          }
        }
      }
    `,
  };

  const graphqlResponse = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graphqlQuery),
  });

  const { data } = await graphqlResponse.json() as { data: { recipes: GraphQLRecipe[] } };
  const selectedRecipes = data.recipes.filter((r) => recipeIds.includes(r.id));

  // Calculate nutrition for each recipe
  const recipeNutritionData: RecipeNutrition[] = selectedRecipes.map((recipe) => {
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
  });

  const totalCalories = recipeNutritionData.reduce((sum, r) => sum + r.calories, 0);
  const totalProtein = recipeNutritionData.reduce((sum, r) => sum + r.protein, 0);
  const totalFat = recipeNutritionData.reduce((sum, r) => sum + r.fat, 0);
  const totalCarbs = recipeNutritionData.reduce((sum, r) => sum + r.carbs, 0);
  const recipeTitles = recipeNutritionData.map((r) => r.title).join(',');
  const calories = recipeNutritionData.map((r) => r.calories);
  const avgCalories = totalCalories / recipeNutritionData.length;
  const avgProtein = totalProtein / recipeNutritionData.length;

  if (activeSpan) {
    activeSpan.setAttributes({
      'batch_nutrition.recipe_titles': recipeTitles,
      'batch_nutrition.recipes_analyzed': recipeNutritionData.length,
      'batch_nutrition.total_calories': totalCalories,
      'batch_nutrition.total_protein': totalProtein,
      'batch_nutrition.total_fat': totalFat,
      'batch_nutrition.total_carbs': totalCarbs,
      'batch_nutrition.avg_calories_per_recipe': avgCalories,
      'batch_nutrition.avg_protein_per_recipe': avgProtein,
      'batch_nutrition.calories_range_min': Math.min(...calories),
      'batch_nutrition.calories_range_max': Math.max(...calories),
    });
  }

  res.json({
    recipes: recipeNutritionData,
    count: recipeNutritionData.length,
  });
});

// Error handling middleware - must be last
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const activeSpan = trace.getActiveSpan();

  if (activeSpan) {
    activeSpan.recordException(err);
    activeSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message,
    });
  }

  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT);
