export type NutritionData = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type InventoryData = {
  inStock: boolean;
  quantity: number;
};

export type ShoppingListRequest = {
  recipeIds: string[];
  servings?: Record<string, number>;
};

export type ShoppingListItem = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
  inStock: boolean;
};

export type GraphQLRecipe = {
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

export type BatchNutritionRequest = {
  recipeIds: string[];
};

export type RecipeNutrition = {
  recipeId: string;
  title: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};
