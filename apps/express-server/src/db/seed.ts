import { randomUUID } from "node:crypto";
import { db } from "./client";
import { recipes, recipeIngredients } from "./schema";
import { logger } from "../otel";

type SeedRecipe = {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  categoryId: string;
  ingredients: { ingredientId: string; quantity: number }[];
};

const seedRecipes: SeedRecipe[] = [
  {
    title: "Pancakes",
    description: "Fluffy breakfast pancakes",
    prepTime: 10,
    cookTime: 15,
    difficulty: "Easy",
    servings: 4,
    categoryId: "1",
    ingredients: [
      { ingredientId: "1", quantity: 2 },
      { ingredientId: "2", quantity: 1.5 },
      { ingredientId: "3", quantity: 1 },
      { ingredientId: "4", quantity: 0.25 },
      { ingredientId: "5", quantity: 2 },
    ],
  },
  {
    title: "Chicken Fried Rice",
    description: "Classic Asian-style fried rice with chicken",
    prepTime: 15,
    cookTime: 20,
    difficulty: "Medium",
    servings: 4,
    categoryId: "3",
    ingredients: [
      { ingredientId: "6", quantity: 1 },
      { ingredientId: "7", quantity: 2 },
      { ingredientId: "1", quantity: 2 },
      { ingredientId: "9", quantity: 1 },
      { ingredientId: "10", quantity: 3 },
    ],
  },
  {
    title: "Garlic Butter Chicken",
    description: "Tender chicken with garlic butter sauce",
    prepTime: 10,
    cookTime: 25,
    difficulty: "Medium",
    servings: 4,
    categoryId: "3",
    ingredients: [
      { ingredientId: "6", quantity: 1.5 },
      { ingredientId: "5", quantity: 4 },
      { ingredientId: "10", quantity: 6 },
    ],
  },
];

export function seedIfEmpty(): void {
  const existing = db.select().from(recipes).all();
  if (existing.length > 0) {
    logger.info("Database already has recipes, skipping seed", {
      "seed.existing_count": existing.length,
    });
    return;
  }

  const now = new Date().toISOString();

  db.transaction((tx) => {
    for (const seed of seedRecipes) {
      const id = randomUUID();
      tx.insert(recipes)
        .values({
          id,
          title: seed.title,
          description: seed.description,
          prepTime: seed.prepTime,
          cookTime: seed.cookTime,
          difficulty: seed.difficulty,
          servings: seed.servings,
          categoryId: seed.categoryId,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      if (seed.ingredients.length > 0) {
        tx.insert(recipeIngredients)
          .values(
            seed.ingredients.map((ing) => ({
              recipeId: id,
              ingredientId: ing.ingredientId,
              quantity: ing.quantity,
            })),
          )
          .run();
      }
    }
  });

  logger.info("Seeded database with initial recipes", {
    "seed.count": seedRecipes.length,
  });
}
