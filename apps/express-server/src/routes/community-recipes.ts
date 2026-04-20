import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import {
  communityRecipes,
  communityRecipeIngredients,
  type CommunityRecipeIngredientRow,
  type CommunityRecipeRow,
} from "../db/schema";
import {
  communityRecipeCreateSchema,
  communityRecipeUpdateSchema,
} from "../schemas";

const router = Router();

type CommunityRecipeResponse = CommunityRecipeRow & {
  ingredients: { ingredientId: string; quantity: number }[];
};

function toResponse(
  recipe: CommunityRecipeRow,
  ingredients: CommunityRecipeIngredientRow[],
): CommunityRecipeResponse {
  return {
    ...recipe,
    ingredients: ingredients
      .filter((i) => i.recipeId === recipe.id)
      .map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity })),
  };
}

router.get("/community-recipes", (_req: Request, res: Response) => {
  const recipes = db
    .select()
    .from(communityRecipes)
    .orderBy(communityRecipes.createdAt)
    .all();

  const recipeIds = recipes.map((r) => r.id);
  const ingredients =
    recipeIds.length === 0
      ? []
      : db
          .select()
          .from(communityRecipeIngredients)
          .where(inArray(communityRecipeIngredients.recipeId, recipeIds))
          .all();

  res.json({
    recipes: recipes.map((r) => toResponse(r, ingredients)),
  });
});

router.get("/community-recipes/:id", (req: Request, res: Response) => {
  const id = String(req.params.id);

  const recipe = db
    .select()
    .from(communityRecipes)
    .where(eq(communityRecipes.id, id))
    .get();

  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  const ingredients = db
    .select()
    .from(communityRecipeIngredients)
    .where(eq(communityRecipeIngredients.recipeId, id))
    .all();

  res.json(toResponse(recipe, ingredients));
});

router.post("/community-recipes", (req: Request, res: Response) => {
  const parsed = communityRecipeCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const input = parsed.data;
  const id = randomUUID();
  const now = new Date().toISOString();
  const recipeRow = {
    id,
    title: input.title,
    description: input.description,
    prepTime: input.prepTime,
    cookTime: input.cookTime,
    difficulty: input.difficulty,
    servings: input.servings,
    categoryId: input.categoryId,
    createdAt: now,
    updatedAt: now,
  } satisfies CommunityRecipeRow;

  db.transaction((tx) => {
    tx.insert(communityRecipes).values(recipeRow).run();

    if (input.ingredients.length > 0) {
      const rows = input.ingredients.map((ing) => ({
        recipeId: id,
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
      }));
      tx.insert(communityRecipeIngredients).values(rows).run();
    }
  });

  res.status(201).json(
    toResponse(
      recipeRow,
      input.ingredients.map((ing, idx) => ({
        id: idx,
        recipeId: id,
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
      })),
    ),
  );
});

router.put("/community-recipes/:id", (req: Request, res: Response) => {
  const id = String(req.params.id);
  const parsed = communityRecipeUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const existing = db
    .select()
    .from(communityRecipes)
    .where(eq(communityRecipes.id, id))
    .get();

  if (!existing) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  const { ingredients, ...recipeFields } = parsed.data;
  const updatedAt = new Date().toISOString();

  const updatedRecipe = {
    ...existing,
    ...recipeFields,
    updatedAt,
  } satisfies CommunityRecipeRow;

  db.transaction((tx) => {
    tx.update(communityRecipes)
      .set({ ...recipeFields, updatedAt })
      .where(eq(communityRecipes.id, id))
      .run();

    if (ingredients !== undefined) {
      tx.delete(communityRecipeIngredients)
        .where(eq(communityRecipeIngredients.recipeId, id))
        .run();

      if (ingredients.length > 0) {
        const rows = ingredients.map((ing) => ({
          recipeId: id,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
        }));
        tx.insert(communityRecipeIngredients).values(rows).run();
      }
    }
  });

  const refreshedIngredients = db
    .select()
    .from(communityRecipeIngredients)
    .where(eq(communityRecipeIngredients.recipeId, id))
    .all();

  res.json(toResponse(updatedRecipe, refreshedIngredients));
});

router.delete("/community-recipes/:id", (req: Request, res: Response) => {
  const id = String(req.params.id);

  const result = db
    .delete(communityRecipes)
    .where(eq(communityRecipes.id, id))
    .run();

  if (Number(result.changes) === 0) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  res.status(204).send();
});

export default router;
