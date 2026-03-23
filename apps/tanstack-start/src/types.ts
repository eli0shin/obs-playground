export type Recipe = {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  categoryId?: string;
  ingredients?: RecipeIngredient[];
};

export type RecipeIngredient = {
  ingredient: Ingredient;
  quantity: number;
};

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type IngredientCost = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
};

export type RecipeWithCost = {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  ingredientCosts: IngredientCost[];
  totalCost: number;
};

export type RecipeWithNutrition = {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

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

export type ShoppingListItem = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
  inStock: boolean;
};

export type ShoppingListResponse = {
  items: ShoppingListItem[];
  totalCost: number;
  outOfStock: string[];
  recipeCount: number;
};

export type RecipeCost = {
  recipeId: string;
  title: string;
  cost: number;
};

export type MealPlanEstimate = {
  recipes: RecipeCost[];
  totalWeeklyCost: number;
  averageMealCost: number;
  mealCount: number;
};

export type RecipeNutrition = {
  recipeId: string;
  title: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type BatchNutritionResponse = {
  recipes: RecipeNutrition[];
  count: number;
};

export type CreateRecipeInput = {
  recipe: {
    title: string;
    description: string;
    prepTime: number;
    cookTime: number;
    difficulty: string;
    servings: number;
    categoryId: string;
  };
  ingredients: { ingredientId: string; quantity: number }[];
};
