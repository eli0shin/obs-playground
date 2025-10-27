import type {
  Category,
  Ingredient,
  Recipe,
  RecipeIngredient,
} from "../types/index.js";

export const categories: Category[] = [
  { id: "1", name: "Breakfast", slug: "breakfast" },
  { id: "2", name: "Lunch", slug: "lunch" },
  { id: "3", name: "Dinner", slug: "dinner" },
  { id: "4", name: "Dessert", slug: "dessert" },
  { id: "5", name: "Snacks", slug: "snacks" },
];

export const ingredients: Ingredient[] = [
  { id: "1", name: "Eggs", category: "Protein", unit: "piece" },
  { id: "2", name: "Flour", category: "Grains", unit: "cup" },
  { id: "3", name: "Milk", category: "Dairy", unit: "cup" },
  { id: "4", name: "Sugar", category: "Sweeteners", unit: "cup" },
  { id: "5", name: "Butter", category: "Dairy", unit: "tablespoon" },
  { id: "6", name: "Chicken Breast", category: "Protein", unit: "pound" },
  { id: "7", name: "Rice", category: "Grains", unit: "cup" },
  { id: "8", name: "Tomato", category: "Vegetables", unit: "piece" },
  { id: "9", name: "Onion", category: "Vegetables", unit: "piece" },
  { id: "10", name: "Garlic", category: "Vegetables", unit: "clove" },
];

export const recipes: Recipe[] = [
  {
    id: "1",
    title: "Pancakes",
    description: "Fluffy breakfast pancakes",
    prepTime: 10,
    cookTime: 15,
    difficulty: "Easy",
    servings: 4,
    categoryId: "1",
  },
  {
    id: "2",
    title: "Chicken Fried Rice",
    description: "Classic Asian-style fried rice with chicken",
    prepTime: 15,
    cookTime: 20,
    difficulty: "Medium",
    servings: 4,
    categoryId: "3",
  },
  {
    id: "3",
    title: "Garlic Butter Chicken",
    description: "Tender chicken with garlic butter sauce",
    prepTime: 10,
    cookTime: 25,
    difficulty: "Medium",
    servings: 4,
    categoryId: "3",
  },
];

export const recipeIngredients: RecipeIngredient[] = [
  // Pancakes
  { recipeId: "1", ingredientId: "1", quantity: 2 },
  { recipeId: "1", ingredientId: "2", quantity: 1.5 },
  { recipeId: "1", ingredientId: "3", quantity: 1 },
  { recipeId: "1", ingredientId: "4", quantity: 0.25 },
  { recipeId: "1", ingredientId: "5", quantity: 2 },
  // Chicken Fried Rice
  { recipeId: "2", ingredientId: "6", quantity: 1 },
  { recipeId: "2", ingredientId: "7", quantity: 2 },
  { recipeId: "2", ingredientId: "1", quantity: 2 },
  { recipeId: "2", ingredientId: "9", quantity: 1 },
  { recipeId: "2", ingredientId: "10", quantity: 3 },
  // Garlic Butter Chicken
  { recipeId: "3", ingredientId: "6", quantity: 1.5 },
  { recipeId: "3", ingredientId: "5", quantity: 4 },
  { recipeId: "3", ingredientId: "10", quantity: 6 },
];

export let recipeIdCounter = recipes.length + 1;

export function incrementRecipeIdCounter(): number {
  return recipeIdCounter++;
}
