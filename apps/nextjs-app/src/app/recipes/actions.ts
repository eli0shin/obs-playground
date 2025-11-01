"use server";

import { redirect } from "next/navigation";
import { trace } from "@opentelemetry/api";
import { graphqlRequest } from "@obs-playground/graphql-client";

export async function createRecipeAction(formData: FormData) {
  const activeSpan = trace.getActiveSpan();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const prepTime = parseInt(formData.get("prepTime") as string, 10);
  const cookTime = parseInt(formData.get("cookTime") as string, 10);
  const difficulty = formData.get("difficulty") as string;
  const servings = parseInt(formData.get("servings") as string, 10);
  const categoryId = formData.get("categoryId") as string;

  const ingredientsJson = formData.get("ingredients") as string;
  const ingredients = JSON.parse(ingredientsJson);

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

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const prepTime = parseInt(formData.get("prepTime") as string, 10);
  const cookTime = parseInt(formData.get("cookTime") as string, 10);
  const difficulty = formData.get("difficulty") as string;
  const servings = parseInt(formData.get("servings") as string, 10);
  const categoryId = formData.get("categoryId") as string;

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
