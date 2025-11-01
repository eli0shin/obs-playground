"use server";

import { redirect } from "next/navigation";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { GRAPHQL_URL } from "@/config";

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

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
          mutation CreateRecipe($input: CreateRecipeInput!) {
            createRecipe(input: $input) {
              id
              title
              description
            }
          }
        `,
      variables: {
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
    }),
    cache: "no-store",
  });

  const result = await response.json();

  if (result.errors) {
    const error = new Error(`GraphQL error: ${result.errors[0].message}`);
    activeSpan?.recordException(error);
    activeSpan?.setStatus({
      code: SpanStatusCode.ERROR,
      message: result.errors[0].message,
    });
    throw error;
  }

  const createdRecipe = result.data.createRecipe;

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

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
          mutation UpdateRecipe($id: ID!, $recipe: RecipeInput!) {
            updateRecipe(id: $id, recipe: $recipe) {
              id
              title
              description
            }
          }
        `,
      variables: {
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
    }),
    cache: "no-store",
  });

  const result = await response.json();

  if (result.errors) {
    const error = new Error(`GraphQL error: ${result.errors[0].message}`);
    activeSpan?.recordException(error);
    activeSpan?.setStatus({
      code: SpanStatusCode.ERROR,
      message: result.errors[0].message,
    });
    throw error;
  }

  redirect(`/recipes/${id}`);
}

export async function deleteRecipeAction(id: string) {
  const activeSpan = trace.getActiveSpan();

  activeSpan?.setAttributes({
    "action.type": "delete_recipe",
    "action.source": "server_action",
    "recipe.id": id,
  });

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
          mutation DeleteRecipe($id: ID!) {
            deleteRecipe(id: $id)
          }
        `,
      variables: { id },
    }),
    cache: "no-store",
  });

  const result = await response.json();

  if (result.errors) {
    const error = new Error(`GraphQL error: ${result.errors[0].message}`);
    activeSpan?.recordException(error);
    activeSpan?.setStatus({
      code: SpanStatusCode.ERROR,
      message: result.errors[0].message,
    });
    throw error;
  }

  const success = result.data.deleteRecipe;

  activeSpan?.setAttributes({
    "recipe.deletion_success": success,
  });

  if (!success) {
    throw new Error("Failed to delete recipe");
  }

  redirect("/");
}

export async function brokenCreateRecipeAction(_formData: FormData) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        mutation ErrorMutation {
          errorMutation(input: "test")
        }
      `,
    }),
    cache: "no-store",
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL error: ${result.errors[0].message}`);
  }
}
