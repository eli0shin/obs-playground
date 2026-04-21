import type { Category, Ingredient } from "../generated/resolvers-types.js";

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
