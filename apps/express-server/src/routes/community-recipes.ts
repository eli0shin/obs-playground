import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { trace } from "@opentelemetry/api";
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
  const activeSpan = trace.getActiveSpan();

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

  activeSpan?.setAttributes({
    "community_recipe.count": recipes.length,
    "community_recipe.ingredient_count": ingredients.length,
  });

  res.json({
    recipes: recipes.map((r) => toResponse(r, ingredients)),
  });
});

router.get("/community-recipes/:id", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const id = String(req.params.id);

  activeSpan?.setAttributes({
    "community_recipe.id": id,
    "community_recipe.action": "get",
  });

  const recipe = db
    .select()
    .from(communityRecipes)
    .where(eq(communityRecipes.id, id))
    .get();

  if (!recipe) {
    activeSpan?.setAttributes({ "community_recipe.found": false });
    return res.status(404).json({ error: "Recipe not found" });
  }

  const ingredients = db
    .select()
    .from(communityRecipeIngredients)
    .where(eq(communityRecipeIngredients.recipeId, id))
    .all();

  activeSpan?.setAttributes({
    "community_recipe.title": recipe.title,
    "community_recipe.category_id": recipe.categoryId,
    "community_recipe.ingredient_count": ingredients.length,
  });

  res.json(toResponse(recipe, ingredients));
});

router.post("/community-recipes", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const parsed = communityRecipeCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    activeSpan?.recordException(parsed.error);
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

  const createdIngredients = db
    .select()
    .from(communityRecipeIngredients)
    .where(eq(communityRecipeIngredients.recipeId, id))
    .all();

  activeSpan?.setAttributes({
    "community_recipe.id": id,
    "community_recipe.title": recipeRow.title,
    "community_recipe.category_id": recipeRow.categoryId,
    "community_recipe.difficulty": recipeRow.difficulty,
    "community_recipe.servings": recipeRow.servings,
    "community_recipe.ingredient_count": createdIngredients.length,
  });

  res.status(201).json(toResponse(recipeRow, createdIngredients));
});

router.put("/community-recipes/:id", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const id = String(req.params.id);
  const parsed = communityRecipeUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    activeSpan?.recordException(parsed.error);
    return res.status(400).json({ error: parsed.error.issues });
  }

  activeSpan?.setAttributes({
    "community_recipe.id": id,
    "community_recipe.updated_fields": Object.keys(parsed.data),
  });

  const existing = db
    .select()
    .from(communityRecipes)
    .where(eq(communityRecipes.id, id))
    .get();

  if (!existing) {
    activeSpan?.setAttributes({ "community_recipe.found": false });
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

  activeSpan?.setAttributes({
    "community_recipe.ingredients_replaced": ingredients !== undefined,
    "community_recipe.ingredient_count": refreshedIngredients.length,
  });

  res.json(toResponse(updatedRecipe, refreshedIngredients));
});

router.delete("/community-recipes/:id", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const id = String(req.params.id);

  activeSpan?.setAttributes({
    "community_recipe.id": id,
    "community_recipe.action": "delete",
  });

  const result = db
    .delete(communityRecipes)
    .where(eq(communityRecipes.id, id))
    .run();

  const deleted = Number(result.changes) > 0;

  if (!deleted) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  res.status(204).send();
});

export default router;
