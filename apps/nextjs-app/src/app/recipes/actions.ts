"use server";

import { redirect } from "next/navigation";
import { trace } from "@opentelemetry/api";
import {
  graphqlRequest,
  type CreateRecipeInput,
  type RecipeInput,
} from "@obs-playground/graphql-client";
import {
  CreateRecipeDocument,
  DeleteRecipeDocument,
  ErrorMutationDocument,
  UpdateRecipeDocument,
} from "@obs-playground/graphql-client/documents";
import { z } from "zod";
import { logger } from "@/logger";

type ServerAction<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => Promise<TReturn>;

function isRedirectError(err: unknown): boolean {
  if (!err || typeof err !== "object" || !("digest" in err)) {
    return false;
  }
  const digest = err.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function withActionLogging<TArgs extends unknown[], TReturn>(
  action: ServerAction<TArgs, TReturn>,
): ServerAction<TArgs, TReturn> {
  return async (...args) => {
    logger.info("Server action started", {
      "action.function_name": action.name,
    });
    try {
      return await action(...args);
    } catch (err) {
      if (isRedirectError(err)) {
        throw err;
      }
      logger.error("Server action failed", {
        "action.function_name": action.name,
        err,
      });
      throw err;
    }
  };
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const ingredientSchema = z.array(
  z.object({
    ingredientId: z.string(),
    quantity: z.number(),
  }),
);

async function createRecipe(formData: FormData) {
  const activeSpan = trace.getActiveSpan();

  const title = getFormString(formData, "title");
  const description = getFormString(formData, "description");
  const prepTime = parseInt(getFormString(formData, "prepTime"), 10);
  const cookTime = parseInt(getFormString(formData, "cookTime"), 10);
  const difficulty = getFormString(formData, "difficulty");
  const servings = parseInt(getFormString(formData, "servings"), 10);
  const categoryId = getFormString(formData, "categoryId");

  const ingredientsJson = getFormString(formData, "ingredients");
  const ingredientsResult = ingredientSchema.safeParse(
    JSON.parse(ingredientsJson || "[]"),
  );
  const ingredients = ingredientsResult.success ? ingredientsResult.data : [];

  activeSpan?.setAttributes({
    "recipe.title": title,
    "recipe.difficulty": difficulty,
    "recipe.prep_time": prepTime,
    "recipe.cook_time": cookTime,
    "recipe.servings": servings,
    "recipe.ingredient_count": ingredients.length,
  });

  const input = {
    recipe: {
      title,
      description,
      prepTime,
      cookTime,
      difficulty,
      servings,
      categoryId,
    } satisfies RecipeInput,
    ingredients,
  } satisfies CreateRecipeInput;

  const { createRecipe: createdRecipe } = await graphqlRequest(
    CreateRecipeDocument,
    { input },
  );

  activeSpan?.setAttributes({
    "recipe.id": createdRecipe.id,
  });

  logger.info("Recipe creation submitted via server action", {
    "recipe.id": createdRecipe.id,
    "recipe.title": createdRecipe.title,
    "recipe.difficulty": difficulty,
    "recipe.servings": servings,
    "recipe.ingredient_count": ingredients.length,
    "recipe.ingredients_parse_success": ingredientsResult.success,
  });

  redirect(`/recipes/${createdRecipe.id}`);
}

async function updateRecipe(id: string, formData: FormData) {
  const activeSpan = trace.getActiveSpan();

  activeSpan?.setAttributes({
    "recipe.id": id,
  });

  const title = getFormString(formData, "title");
  const description = getFormString(formData, "description");
  const prepTime = parseInt(getFormString(formData, "prepTime"), 10);
  const cookTime = parseInt(getFormString(formData, "cookTime"), 10);
  const difficulty = getFormString(formData, "difficulty");
  const servings = parseInt(getFormString(formData, "servings"), 10);
  const categoryId = getFormString(formData, "categoryId");

  activeSpan?.setAttributes({
    "recipe.title": title,
    "recipe.difficulty": difficulty,
    "recipe.prep_time": prepTime,
    "recipe.cook_time": cookTime,
  });

  const recipe = {
    title,
    description,
    prepTime,
    cookTime,
    difficulty,
    servings,
    categoryId,
  } satisfies RecipeInput;

  await graphqlRequest(UpdateRecipeDocument, {
    id,
    recipe,
  });

  logger.info("Recipe update submitted via server action", {
    "recipe.id": id,
    "recipe.title": title,
    "recipe.difficulty": difficulty,
    "recipe.servings": servings,
  });

  redirect(`/recipes/${id}`);
}

async function deleteRecipe(id: string, _formData: FormData) {
  const activeSpan = trace.getActiveSpan();

  activeSpan?.setAttributes({
    "recipe.id": id,
  });

  const { deleteRecipe: success } = await graphqlRequest(DeleteRecipeDocument, {
    id,
  });

  activeSpan?.setAttributes({
    "recipe.deletion_success": success,
  });

  logger.info("Recipe deletion submitted via server action", {
    "recipe.id": id,
    "recipe.deletion_success": success,
  });

  if (!success) {
    throw new Error("Failed to delete recipe");
  }

  redirect("/");
}

async function brokenCreateRecipe(_formData: FormData) {
  await graphqlRequest(ErrorMutationDocument);
}

export const createRecipeAction = withActionLogging(createRecipe);
export const updateRecipeAction = withActionLogging(updateRecipe);
export const deleteRecipeAction = withActionLogging(deleteRecipe);
export const brokenCreateRecipeAction = withActionLogging(brokenCreateRecipe);
