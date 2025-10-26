import './otel.js';
import express, { Request, Response } from 'express';

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
  const { id } = req.params;
  const price = ingredientPrices[id];

  if (price === undefined) {
    return res.status(404).json({ error: 'Ingredient not found' });
  }

  res.json({ ingredientId: id, price });
});

app.get('/ingredients/prices', (req: Request, res: Response) => {
  const { ids } = req.query;

  if (!ids) {
    // Return all prices
    return res.json(ingredientPrices);
  }

  // Return specific prices
  const idArray = (ids as string).split(',');
  const prices: Record<string, number> = {};

  idArray.forEach((id) => {
    if (ingredientPrices[id] !== undefined) {
      prices[id] = ingredientPrices[id];
    }
  });

  res.json(prices);
});

app.post('/ingredients/prices', (req: Request, res: Response) => {
  const updates = req.body as Record<string, number>;

  Object.entries(updates).forEach(([id, price]) => {
    ingredientPrices[id] = price;
  });

  res.json({ success: true, updated: Object.keys(updates) });
});

// Nutrition endpoints
app.get('/nutrition/ingredient/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const nutrition = ingredientNutrition[id];

  if (!nutrition) {
    return res.status(404).json({ error: 'Ingredient nutrition not found' });
  }

  res.json(nutrition);
});

// Inventory endpoints
app.get('/inventory/stock/:ingredientId', (req: Request, res: Response) => {
  const { ingredientId } = req.params;
  const inventory = ingredientInventory[ingredientId];

  if (!inventory) {
    return res.status(404).json({ error: 'Ingredient not found in inventory' });
  }

  res.json(inventory);
});

// Orchestration endpoints (Express → GraphQL)

// Shopping list generation
app.post('/shopping-list/generate', async (req: Request, res: Response) => {
  try {
    const { recipeIds, servings = {} } = req.body as ShoppingListRequest;

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

    res.json({
      items: shoppingList,
      totalCost,
      outOfStock,
      recipeCount: selectedRecipes.length,
    });
  } catch (error) {
    console.error('Error generating shopping list:', error);
    res.status(500).json({ error: 'Failed to generate shopping list' });
  }
});

// Meal plan cost estimation
app.get('/meal-plan/estimate', async (req: Request, res: Response) => {
  try {
    const { recipeIds } = req.query;

    if (!recipeIds || typeof recipeIds !== 'string') {
      return res.status(400).json({ error: 'recipeIds query parameter is required' });
    }

    const idsArray = recipeIds.split(',');

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

    res.json({
      recipes: recipeCosts,
      totalWeeklyCost,
      averageMealCost,
      mealCount: recipeCosts.length,
    });
  } catch (error) {
    console.error('Error estimating meal plan:', error);
    res.status(500).json({ error: 'Failed to estimate meal plan' });
  }
});

// Batch nutrition analysis
app.post('/batch/nutrition', async (req: Request, res: Response) => {
  try {
    const { recipeIds } = req.body as BatchNutritionRequest;

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

    res.json({
      recipes: recipeNutritionData,
      count: recipeNutritionData.length,
    });
  } catch (error) {
    console.error('Error calculating batch nutrition:', error);
    res.status(500).json({ error: 'Failed to calculate nutrition' });
  }
});

app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
