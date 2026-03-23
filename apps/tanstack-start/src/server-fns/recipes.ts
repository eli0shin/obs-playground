import { createServerFn } from "@tanstack/react-start";
import { graphqlRequest } from "@obs-playground/graphql-client";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import type {
  Recipe,
  Category,
  Ingredient,
  RecipeWithCost,
  RecipeWithNutrition,
} from "../types";

export const getRecipesAndCategories = createServerFn({
  method: "GET",
}).handler(async () => {
  return graphqlRequest<{ recipes: Recipe[]; categories: Category[] }>(`
    query GetRecipesAndCategories {
      recipes {
        id
        title
        description
        prepTime
        cookTime
        difficulty
        servings
      }
      categories {
        id
        name
        slug
      }
    }
  `);
});

export const getCategoriesAndRecipes = createServerFn({
  method: "GET",
}).handler(async () => {
  return graphqlRequest<{
    categories: Category[];
    recipes: (Recipe & { categoryId: string })[];
  }>(`
    query GetCategoryRecipes {
      categories {
        id
        name
        slug
      }
      recipes {
        id
        title
        description
        prepTime
        cookTime
        difficulty
        servings
        categoryId
      }
    }
  `);
});

export const getRecipe = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const activeSpan = trace.getActiveSpan();
    activeSpan?.setAttributes({ "recipe.id": id });

    const result = await graphqlRequest<{ recipe: Recipe | null }>(
      `
        query GetRecipe($id: ID!) {
          recipe(id: $id) {
            id
            title
            description
            prepTime
            cookTime
            difficulty
            servings
            ingredients {
              ingredient {
                id
                name
                unit
              }
              quantity
            }
          }
        }
      `,
      { id },
    );

    activeSpan?.setAttributes({
      "recipe.found": result.recipe !== null,
      "recipe.title": result.recipe?.title ?? "",
      "recipe.ingredient_count": result.recipe?.ingredients?.length ?? 0,
    });

    return result.recipe;
  });

export const getRecipeWithCost = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await graphqlRequest<{
      recipeWithCost: RecipeWithCost | null;
    }>(
      `
        query GetRecipeWithCost($id: ID!) {
          recipeWithCost(id: $id) {
            id
            title
            description
            prepTime
            cookTime
            difficulty
            servings
            ingredientCosts {
              ingredientId
              name
              quantity
              unit
              pricePerUnit
              totalCost
            }
            totalCost
          }
        }
      `,
      { id },
    );

    return result.recipeWithCost;
  });

export const getRecipeWithNutrition = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await graphqlRequest<{
      recipeWithNutrition: RecipeWithNutrition | null;
    }>(
      `
        query GetRecipeWithNutrition($id: ID!) {
          recipeWithNutrition(id: $id) {
            id
            title
            description
            prepTime
            cookTime
            difficulty
            servings
            calories
            protein
            fat
            carbs
          }
        }
      `,
      { id },
    );

    return result.recipeWithNutrition;
  });

export const getRecipesWithCost = createServerFn({ method: "GET" })
  .inputValidator((ids: string) => ids)
  .handler(async ({ data: ids }) => {
    const idList = ids.split(",");
    const promises = idList.map(async (id) => {
      const result = await graphqlRequest<{
        recipeWithCost: RecipeWithCost;
      }>(
        `
          query GetRecipeWithCost($id: ID!) {
            recipeWithCost(id: $id) {
              id
              title
              description
              difficulty
              servings
              ingredientCosts {
                ingredientId
                name
                quantity
                unit
                pricePerUnit
                totalCost
              }
              totalCost
            }
          }
        `,
        { id },
      );
      return result.recipeWithCost;
    });

    return Promise.all(promises);
  });

export const getCategoriesAndIngredients = createServerFn({
  method: "GET",
}).handler(async () => {
  return graphqlRequest<{ categories: Category[]; ingredients: Ingredient[] }>(
    `
      query GetCategoriesAndIngredients {
        categories {
          id
          name
          slug
        }
        ingredients {
          id
          name
          unit
        }
      }
    `,
  );
});

export const getNotFoundRecipe = createServerFn({
  method: "GET",
}).handler(async () => {
  const result = await graphqlRequest<{ recipe: Recipe | null }>(
    `
      query GetRecipe($id: ID!) {
        recipe(id: $id) {
          id
          title
        }
      }
    `,
    { id: "nonexistent-id-999" },
  );

  if (!result.recipe) {
    const err = new Error("Recipe not found - notFoundRecipe returned null");
    trace.getActiveSpan()?.recordException(err);
    trace.getActiveSpan()?.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message,
    });
    throw err;
  }

  return result.recipe;
});

export const getErrorQuery = createServerFn({
  method: "GET",
}).handler(async () => {
  return graphqlRequest<{ errorQuery: string }>(
    `
      query ErrorQuery {
        errorQuery
      }
    `,
  );
});
