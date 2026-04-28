import { createServerFn } from "@tanstack/react-start";
import { graphqlRequest } from "@obs-playground/graphql-client";
import { getExpressUrl } from "@obs-playground/env";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { z } from "zod";
import type { CreateRecipeInput } from "../types";

type RecipeInput = CreateRecipeInput["recipe"];

export const createRecipe = createServerFn({ method: "POST" })
  .inputValidator((data: CreateRecipeInput) => data)
  .handler(async ({ data }) => {
    const activeSpan = trace.getActiveSpan();
    activeSpan?.setAttributes({
      "recipe.action": "create",
      "recipe.title": data.recipe.title,
      "recipe.difficulty": data.recipe.difficulty,
      "recipe.prep_time": data.recipe.prepTime,
      "recipe.cook_time": data.recipe.cookTime,
      "recipe.servings": data.recipe.servings,
      "recipe.ingredient_count": data.ingredients.length,
    });

    const result = await graphqlRequest<{
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
      { input: data },
    );

    activeSpan?.setAttributes({
      "recipe.id": result.createRecipe.id,
    });

    return result.createRecipe;
  });

export const deleteRecipe = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const activeSpan = trace.getActiveSpan();
    activeSpan?.setAttributes({
      "action.type": "delete_recipe",
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
      const err = new Error("Failed to delete recipe");
      activeSpan?.recordException(err);
      activeSpan?.setStatus({
        code: SpanStatusCode.ERROR,
        message: err.message,
      });
      throw err;
    }

    return success;
  });

export const updateRecipe = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; recipe: RecipeInput }) => data)
  .handler(async ({ data }) => {
    const activeSpan = trace.getActiveSpan();
    activeSpan?.setAttributes({
      "recipe.action": "update",
      "recipe.id": data.id,
      "recipe.title": data.recipe.title,
      "recipe.difficulty": data.recipe.difficulty,
      "recipe.prep_time": data.recipe.prepTime,
      "recipe.cook_time": data.recipe.cookTime,
    });

    const result = await graphqlRequest<{
      updateRecipe: { id: string; title: string; description: string } | null;
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
      data,
    );

    if (!result.updateRecipe) {
      throw new Error("Failed to update recipe");
    }

    return result.updateRecipe;
  });

export const brokenCreateRecipe = createServerFn({
  method: "POST",
}).handler(async () => {
  return graphqlRequest<{ errorMutation: string }>(
    `
        mutation ErrorMutation {
          errorMutation(input: "test")
        }
      `,
  );
});

export const getExpressError = createServerFn({
  method: "GET",
}).handler(async () => {
  const response = await fetch(`${getExpressUrl()}/error/test`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const err = new Error(
      `Express API error: ${response.status} ${response.statusText}`,
    );
    trace.getActiveSpan()?.recordException(err);
    trace.getActiveSpan()?.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message,
    });
    throw err;
  }
  const text = await response.text();
  const json = z
    .object({ status: z.string(), message: z.string() })
    .parse(JSON.parse(text));
  return json;
});

export const getExpressTimeout = createServerFn({
  method: "GET",
}).handler(async () => {
  const start = Date.now();
  const response = await fetch(`${getExpressUrl()}/slow/timeout`, {
    cache: "no-store",
  });
  const duration = Date.now() - start;
  return { status: response.status, duration };
});
