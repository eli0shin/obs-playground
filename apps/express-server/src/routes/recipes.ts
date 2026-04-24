import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { trace } from "@opentelemetry/api";
import { eq, inArray, like, or } from "drizzle-orm";
import { db } from "../db/client";
import {
  recipes,
  recipeIngredients,
  type RecipeIngredientRow,
  type RecipeRow,
} from "../db/schema";
import { recipeCreateSchema, recipeUpdateSchema } from "../schemas";

const router = Router();

type RecipeResponse = RecipeRow & {
  ingredients: { ingredientId: string; quantity: number }[];
};

function toResponse(
  recipe: RecipeRow,
  ingredients: RecipeIngredientRow[],
): RecipeResponse {
  return {
    ...recipe,
    ingredients: ingredients
      .filter((i) => i.recipeId === recipe.id)
      .map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity })),
  };
}

router.get("/recipes", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const search = typeof req.query.search === "string" ? req.query.search : "";

  let recipeRows: RecipeRow[];

  if (search) {
    const pattern = `%${search}%`;
    recipeRows = db
      .select()
      .from(recipes)
      .where(
        or(like(recipes.title, pattern), like(recipes.description, pattern)),
      )
      .orderBy(recipes.createdAt)
      .all();
  } else {
    recipeRows = db
      .select()
      .from(recipes)
      .orderBy(recipes.createdAt)
      .all();
  }

  const recipeIds = recipeRows.map((r) => r.id);
  const ingredientRows =
    recipeIds.length === 0
      ? []
      : db
          .select()
          .from(recipeIngredients)
          .where(inArray(recipeIngredients.recipeId, recipeIds))
          .all();

  activeSpan?.setAttributes({
    "recipe.count": recipeRows.length,
    "recipe.ingredient_count": ingredientRows.length,
    "recipe.search": search,
  });

  res.json({
    recipes: recipeRows.map((r) => toResponse(r, ingredientRows)),
  });
});

router.get("/recipes/:id", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const id = String(req.params.id);

  activeSpan?.setAttributes({
    "recipe.id": id,
    "recipe.action": "get",
  });

  const recipe = db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .get();

  if (!recipe) {
    activeSpan?.setAttributes({ "recipe.found": false });
    return res.status(404).json({ error: "Recipe not found" });
  }

  const ingredientRows = db
    .select()
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, id))
    .all();

  activeSpan?.setAttributes({
    "recipe.title": recipe.title,
    "recipe.category_id": recipe.categoryId,
    "recipe.ingredient_count": ingredientRows.length,
  });

  res.json(toResponse(recipe, ingredientRows));
});

router.post("/recipes", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const parsed = recipeCreateSchema.safeParse(req.body);
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
  } satisfies RecipeRow;

  db.transaction((tx) => {
    tx.insert(recipes).values(recipeRow).run();

    if (input.ingredients.length > 0) {
      const rows = input.ingredients.map((ing) => ({
        recipeId: id,
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
      }));
      tx.insert(recipeIngredients).values(rows).run();
    }
  });

  const createdIngredients = db
    .select()
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, id))
    .all();

  activeSpan?.setAttributes({
    "recipe.id": id,
    "recipe.title": recipeRow.title,
    "recipe.category_id": recipeRow.categoryId,
    "recipe.difficulty": recipeRow.difficulty,
    "recipe.servings": recipeRow.servings,
    "recipe.ingredient_count": createdIngredients.length,
  });

  res.status(201).json(toResponse(recipeRow, createdIngredients));
});

router.put("/recipes/:id", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const id = String(req.params.id);
  const parsed = recipeUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    activeSpan?.recordException(parsed.error);
    return res.status(400).json({ error: parsed.error.issues });
  }

  activeSpan?.setAttributes({
    "recipe.id": id,
    "recipe.updated_fields": Object.keys(parsed.data),
  });

  const existing = db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .get();

  if (!existing) {
    activeSpan?.setAttributes({ "recipe.found": false });
    return res.status(404).json({ error: "Recipe not found" });
  }

  const { ingredients: ingredientInput, ...recipeFields } = parsed.data;
  const updatedAt = new Date().toISOString();

  const updatedRecipe = {
    ...existing,
    ...recipeFields,
    updatedAt,
  } satisfies RecipeRow;

  db.transaction((tx) => {
    tx.update(recipes)
      .set({ ...recipeFields, updatedAt })
      .where(eq(recipes.id, id))
      .run();

    if (ingredientInput !== undefined) {
      tx.delete(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, id))
        .run();

      if (ingredientInput.length > 0) {
        const rows = ingredientInput.map((ing) => ({
          recipeId: id,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
        }));
        tx.insert(recipeIngredients).values(rows).run();
      }
    }
  });

  const refreshedIngredients = db
    .select()
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, id))
    .all();

  activeSpan?.setAttributes({
    "recipe.ingredients_replaced": ingredientInput !== undefined,
    "recipe.ingredient_count": refreshedIngredients.length,
  });

  res.json(toResponse(updatedRecipe, refreshedIngredients));
});

router.delete("/recipes/:id", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const id = String(req.params.id);

  activeSpan?.setAttributes({
    "recipe.id": id,
    "recipe.action": "delete",
  });

  const result = db
    .delete(recipes)
    .where(eq(recipes.id, id))
    .run();

  const deleted = Number(result.changes) > 0;

  if (!deleted) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  res.status(204).send();
});

export default router;
