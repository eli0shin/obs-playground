export type Recipe = {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  categoryId: string;
};

export type Ingredient = {
  id: string;
  name: string;
  category: string;
  unit: string;
};

export type RecipeIngredient = {
  recipeId: string;
  ingredientId: string;
  quantity: number;
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

export type NutritionData = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};
