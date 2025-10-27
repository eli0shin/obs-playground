import type { GraphQLRecipe } from "./types.js";

const GRAPHQL_URL = process.env.GRAPHQL_URL || "http://localhost:4000/graphql";

type GraphQLResponse<T> = {
  data?: T;
  errors?: unknown[];
};

export const fetchRecipes = async (): Promise<GraphQLRecipe[]> => {
  const query = {
    query: `
      query GetAllRecipes {
        recipes {
          id
          title
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
  };

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const { data, errors } = (await response.json()) as GraphQLResponse<{
    recipes: GraphQLRecipe[];
  }>;

  if (errors || !data) {
    throw new Error("GraphQL returned errors or no data");
  }

  return data.recipes;
};
