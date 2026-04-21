import { graphqlRequest } from "@obs-playground/graphql-client";
import { getExpressUrl } from "@obs-playground/env";
import { communityRecipeSchema, type CommunityRecipe } from "./schema";

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
};

export async function getCommunityRecipe(
  id: string,
): Promise<CommunityRecipe | null> {
  const response = await fetch(`${getExpressUrl()}/community-recipes/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load recipe: ${response.status}`);
  }

  return communityRecipeSchema.parse(await response.json());
}

export async function getCategoriesAndIngredients() {
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
}
