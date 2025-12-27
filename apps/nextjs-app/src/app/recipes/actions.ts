"use server";

import { redirect } from "next/navigation";
import { trace } from "@opentelemetry/api";
import { graphqlRequest } from "@obs-playground/graphql-client";
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

  const { createRecipe: createdRecipe } = await graphqlRequest<{
    createRecipe: { id: string; title: string; description: string };
  }>(
    `
      mutation CreateRecipe($input: CreateRecipeInput!) {
        createRecipe(input: $input) {
          id
          title
          description
        }
      }
    `,
    {
      input: {
        recipe: {
          title,
          description,
          prepTime,
          cookTime,
          difficulty,
          servings,
          categoryId,
        },
        ingredients,
      },
    },
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

  await graphqlRequest<{
    updateRecipe: { id: string; title: string; description: string };
  }>(
    `
      mutation UpdateRecipe($id: ID!, $recipe: RecipeInput!) {
        updateRecipe(id: $id, recipe: $recipe) {
          id
          title
          description
        }
      }
    `,
    {
      id,
      recipe: {
        title,
        description,
        prepTime,
        cookTime,
        difficulty,
        servings,
        categoryId,
      },
    },
  );

  redirect(`/recipes/${id}`);
}

export async function deleteRecipeAction(id: string) {
  const activeSpan = trace.getActiveSpan();

  activeSpan?.setAttributes({
    "action.type": "delete_recipe",
    "action.source": "server_action",
    "recipe.id": id,
  });

  const { deleteRecipe: success } = await graphqlRequest<{
    deleteRecipe: boolean;
  }>(
    `
      mutation DeleteRecipe($id: ID!) {
        deleteRecipe(id: $id)
      }
    `,
    { id },
  );

  activeSpan?.setAttributes({
    "recipe.deletion_success": success,
  });

  if (!success) {
    throw new Error("Failed to delete recipe");
  }

  redirect("/");
}

export async function brokenCreateRecipeAction(_formData: FormData) {
  await graphqlRequest<{ errorMutation: string }>(
    `
      mutation ErrorMutation {
        errorMutation(input: "test")
      }
    `,
  );
}
