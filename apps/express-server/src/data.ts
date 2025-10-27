import type { NutritionData, InventoryData } from "./types.js";

export const ingredientPrices: Record<string, number> = {
  "1": 0.5, // Eggs - $0.50 per piece
  "2": 2.0, // Flour - $2.00 per cup
  "3": 1.5, // Milk - $1.50 per cup
  "4": 3.0, // Sugar - $3.00 per cup
  "5": 0.3, // Butter - $0.30 per tablespoon
  "6": 8.0, // Chicken Breast - $8.00 per pound
  "7": 1.0, // Rice - $1.00 per cup
  "8": 1.2, // Tomato - $1.20 per piece
  "9": 0.8, // Onion - $0.80 per piece
  "10": 0.2, // Garlic - $0.20 per clove
};

export const ingredientNutrition: Record<string, NutritionData> = {
  "1": { calories: 70, protein: 6, fat: 5, carbs: 0.5 }, // Eggs (per piece)
  "2": { calories: 455, protein: 13, fat: 1, carbs: 95 }, // Flour (per cup)
  "3": { calories: 150, protein: 8, fat: 8, carbs: 12 }, // Milk (per cup)
  "4": { calories: 774, protein: 0, fat: 0, carbs: 200 }, // Sugar (per cup)
  "5": { calories: 102, protein: 0.1, fat: 11.5, carbs: 0 }, // Butter (per tbsp)
  "6": { calories: 748, protein: 140, fat: 16, carbs: 0 }, // Chicken (per pound)
  "7": { calories: 206, protein: 4.3, fat: 0.4, carbs: 45 }, // Rice (per cup)
  "8": { calories: 22, protein: 1, fat: 0.2, carbs: 5 }, // Tomato (per piece)
  "9": { calories: 44, protein: 1.2, fat: 0.1, carbs: 10 }, // Onion (per piece)
  "10": { calories: 4, protein: 0.2, fat: 0, carbs: 1 }, // Garlic (per clove)
};

export const ingredientInventory: Record<string, InventoryData> = {
  "1": { inStock: true, quantity: 100 },
  "2": { inStock: true, quantity: 50 },
  "3": { inStock: true, quantity: 30 },
  "4": { inStock: true, quantity: 20 },
  "5": { inStock: true, quantity: 60 },
  "6": { inStock: true, quantity: 25 },
  "7": { inStock: true, quantity: 40 },
  "8": { inStock: false, quantity: 0 }, // Out of stock
  "9": { inStock: true, quantity: 35 },
  "10": { inStock: true, quantity: 80 },
};
