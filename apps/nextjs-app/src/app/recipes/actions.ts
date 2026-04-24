"use server";

import { redirect } from "next/navigation";
import { trace } from "@opentelemetry/api";
import { graphqlRequest } from "@obs-playground/graphql-client";
import { z } from "zod";
import { logger } from "@/otel";

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
  await graphqlRequest<{ errorMutation: string }>(
    `
      mutation ErrorMutation {
        errorMutation(input: "test")
      }
    `,
  );
}

export const createRecipeAction = withActionLogging(createRecipe);
export const updateRecipeAction = withActionLogging(updateRecipe);
export const deleteRecipeAction = withActionLogging(deleteRecipe);
export const brokenCreateRecipeAction = withActionLogging(brokenCreateRecipe);
