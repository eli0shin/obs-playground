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

export async function createRecipeAction(formData: FormData) {
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

  redirect(`/recipes/${createdRecipe.id}`);
}

export async function updateRecipeAction(id: string, formData: FormData) {
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

  redirect(`/recipes/${id}`);
}

export async function deleteRecipeAction(id: string) {
  const activeSpan = trace.getActiveSpan();

  activeSpan?.setAttributes({
    "action.type": "delete_recipe",
    "action.source": "server_action",
    "recipe.id": id,
  });

  const { deleteRecipe: success } = await graphqlRequest(DeleteRecipeDocument, {
    id,
  });

  activeSpan?.setAttributes({
    "recipe.deletion_success": success,
  });

  if (!success) {
    throw new Error("Failed to delete recipe");
  }

  redirect("/");
}

export async function brokenCreateRecipeAction(_formData: FormData) {
  await graphqlRequest(ErrorMutationDocument);
}
