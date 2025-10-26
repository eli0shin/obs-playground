import "./otel.js";
import { ApolloServer } from "@apollo/server";
import type { GraphQLRequestListener } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import cors from "cors";
import { trace, SpanStatusCode } from "@opentelemetry/api";

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || "http://localhost:3001";

// Types
type Recipe = {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  categoryId: string;
};

type Ingredient = {
  id: string;
  name: string;
  category: string;
  unit: string;
};

type RecipeIngredient = {
  recipeId: string;
  ingredientId: string;
  quantity: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type IngredientCost = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
};

type NutritionData = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

// In-memory data stores
const categories: Category[] = [
  { id: "1", name: "Breakfast", slug: "breakfast" },
  { id: "2", name: "Lunch", slug: "lunch" },
  { id: "3", name: "Dinner", slug: "dinner" },
  { id: "4", name: "Dessert", slug: "dessert" },
  { id: "5", name: "Snacks", slug: "snacks" },
];

const ingredients: Ingredient[] = [
  { id: "1", name: "Eggs", category: "Protein", unit: "piece" },
  { id: "2", name: "Flour", category: "Grains", unit: "cup" },
  { id: "3", name: "Milk", category: "Dairy", unit: "cup" },
  { id: "4", name: "Sugar", category: "Sweeteners", unit: "cup" },
  { id: "5", name: "Butter", category: "Dairy", unit: "tablespoon" },
  { id: "6", name: "Chicken Breast", category: "Protein", unit: "pound" },
  { id: "7", name: "Rice", category: "Grains", unit: "cup" },
  { id: "8", name: "Tomato", category: "Vegetables", unit: "piece" },
  { id: "9", name: "Onion", category: "Vegetables", unit: "piece" },
  { id: "10", name: "Garlic", category: "Vegetables", unit: "clove" },
];

const recipes: Recipe[] = [
  {
    id: "1",
    title: "Pancakes",
    description: "Fluffy breakfast pancakes",
    prepTime: 10,
    cookTime: 15,
    difficulty: "Easy",
    servings: 4,
    categoryId: "1",
  },
  {
    id: "2",
    title: "Chicken Fried Rice",
    description: "Classic Asian-style fried rice with chicken",
    prepTime: 15,
    cookTime: 20,
    difficulty: "Medium",
    servings: 4,
    categoryId: "3",
  },
  {
    id: "3",
    title: "Garlic Butter Chicken",
    description: "Tender chicken with garlic butter sauce",
    prepTime: 10,
    cookTime: 25,
    difficulty: "Medium",
    servings: 4,
    categoryId: "3",
  },
];

const recipeIngredients: RecipeIngredient[] = [
  // Pancakes
  { recipeId: "1", ingredientId: "1", quantity: 2 },
  { recipeId: "1", ingredientId: "2", quantity: 1.5 },
  { recipeId: "1", ingredientId: "3", quantity: 1 },
  { recipeId: "1", ingredientId: "4", quantity: 0.25 },
  { recipeId: "1", ingredientId: "5", quantity: 2 },
  // Chicken Fried Rice
  { recipeId: "2", ingredientId: "6", quantity: 1 },
  { recipeId: "2", ingredientId: "7", quantity: 2 },
  { recipeId: "2", ingredientId: "1", quantity: 2 },
  { recipeId: "2", ingredientId: "9", quantity: 1 },
  { recipeId: "2", ingredientId: "10", quantity: 3 },
  // Garlic Butter Chicken
  { recipeId: "3", ingredientId: "6", quantity: 1.5 },
  { recipeId: "3", ingredientId: "5", quantity: 4 },
  { recipeId: "3", ingredientId: "10", quantity: 6 },
];

let recipeIdCounter = recipes.length + 1;

// GraphQL Schema
const typeDefs = `#graphql
  type Recipe {
    id: ID!
    title: String!
    description: String!
    prepTime: Int!
    cookTime: Int!
    difficulty: String!
    servings: Int!
    categoryId: String!
    category: Category
    ingredients: [RecipeIngredientDetail!]!
  }

  type RecipeWithCost {
    id: ID!
    title: String!
    description: String!
    prepTime: Int!
    cookTime: Int!
    difficulty: String!
    servings: Int!
    ingredientCosts: [IngredientCost!]!
    totalCost: Float!
  }

  type RecipeWithNutrition {
    id: ID!
    title: String!
    description: String!
    prepTime: Int!
    cookTime: Int!
    difficulty: String!
    servings: Int!
    calories: Float!
    protein: Float!
    fat: Float!
    carbs: Float!
  }

  type Ingredient {
    id: ID!
    name: String!
    category: String!
    unit: String!
  }

  type RecipeIngredientDetail {
    ingredient: Ingredient!
    quantity: Float!
  }

  type IngredientCost {
    ingredientId: ID!
    name: String!
    quantity: Float!
    unit: String!
    pricePerUnit: Float!
    totalCost: Float!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
  }

  input RecipeInput {
    title: String!
    description: String!
    prepTime: Int!
    cookTime: Int!
    difficulty: String!
    servings: Int!
    categoryId: String!
  }

  input RecipeIngredientInput {
    ingredientId: String!
    quantity: Float!
  }

  input CreateRecipeInput {
    recipe: RecipeInput!
    ingredients: [RecipeIngredientInput!]!
  }

  type Query {
    recipe(id: ID!): Recipe
    recipeWithCost(id: ID!): RecipeWithCost
    recipeWithNutrition(id: ID!): RecipeWithNutrition
    recipes(categoryId: String, difficulty: String): [Recipe!]!
    searchRecipes(query: String!): [Recipe!]!
    categories: [Category!]!
    ingredients: [Ingredient!]!
  }

  type Mutation {
    createRecipe(input: CreateRecipeInput!): Recipe!
    updateRecipe(id: ID!, recipe: RecipeInput!): Recipe
    deleteRecipe(id: ID!): Boolean!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    recipe: (_: unknown, { id }: { id: string }) => {
      return recipes.find((r) => r.id === id);
    },

    recipeWithCost: async (_: unknown, { id }: { id: string }) => {
      const activeSpan = trace.getActiveSpan();

      if (activeSpan) {
        activeSpan.setAttributes({
          "graphql.resolver": "recipeWithCost",
          "recipe.id": id,
        });
      }

      const recipe = recipes.find((r) => r.id === id);
      if (!recipe) {
        if (activeSpan) {
          activeSpan.setAttribute("recipe.found", false);
        }
        return null;
      }

      const category = categories.find((c) => c.id === recipe.categoryId);

      if (activeSpan) {
        activeSpan.setAttributes({
          "recipe.found": true,
          "recipe.title": recipe.title,
          "recipe.category": category?.name || "Unknown",
          "recipe.difficulty": recipe.difficulty,
          "recipe.prep_time": recipe.prepTime,
          "recipe.cook_time": recipe.cookTime,
          "recipe.total_time": recipe.prepTime + recipe.cookTime,
          "recipe.servings": recipe.servings,
        });
      }

      const recipeIngs = recipeIngredients.filter((ri) => ri.recipeId === id);
      const ingredientIds = recipeIngs.map((ri) => ri.ingredientId);

      if (activeSpan) {
        activeSpan.setAttributes({
          "recipe.ingredient_count": recipeIngs.length,
          "recipe.ingredient_ids": ingredientIds.join(","),
        });
      }

      // Call Express API to get pricing
      const response = await fetch(
        `${EXPRESS_API_URL}/ingredients/prices?ids=${ingredientIds.join(",")}`,
      );
      const prices = (await response.json()) as Record<string, number>;

      const ingredientCosts: IngredientCost[] = recipeIngs.map((ri) => {
        const ingredient = ingredients.find((i) => i.id === ri.ingredientId)!;
        const pricePerUnit = prices[ri.ingredientId] || 0;
        const totalCost = pricePerUnit * ri.quantity;

        return {
          ingredientId: ri.ingredientId,
          name: ingredient.name,
          quantity: ri.quantity,
          unit: ingredient.unit,
          pricePerUnit,
          totalCost,
        };
      });

      const totalCost = ingredientCosts.reduce(
        (sum, ic) => sum + ic.totalCost,
        0,
      );
      const costPerServing = totalCost / recipe.servings;

      if (activeSpan) {
        activeSpan.setAttributes({
          "recipe.total_cost": totalCost,
          "recipe.cost_per_serving": costPerServing,
        });
      }

      return {
        ...recipe,
        ingredientCosts,
        totalCost,
      };
    },

    recipeWithNutrition: async (_: unknown, { id }: { id: string }) => {
      const activeSpan = trace.getActiveSpan();

      if (activeSpan) {
        activeSpan.setAttributes({
          "graphql.resolver": "recipeWithNutrition",
          "recipe.id": id,
        });
      }

      const recipe = recipes.find((r) => r.id === id);
      if (!recipe) {
        if (activeSpan) {
          activeSpan.setAttribute("recipe.found", false);
        }
        return null;
      }

      const category = categories.find((c) => c.id === recipe.categoryId);

      if (activeSpan) {
        activeSpan.setAttributes({
          "recipe.found": true,
          "recipe.title": recipe.title,
          "recipe.category": category?.name || "Unknown",
          "recipe.difficulty": recipe.difficulty,
          "recipe.prep_time": recipe.prepTime,
          "recipe.cook_time": recipe.cookTime,
          "recipe.total_time": recipe.prepTime + recipe.cookTime,
          "recipe.servings": recipe.servings,
        });
      }

      const recipeIngs = recipeIngredients.filter((ri) => ri.recipeId === id);

      if (activeSpan) {
        activeSpan.setAttributes({
          "recipe.ingredient_count": recipeIngs.length,
          "nutrition.parallel_requests": recipeIngs.length,
        });
      }

      // Call Express API to get nutrition for each ingredient
      const nutritionPromises = recipeIngs.map(async (ri) => {
        const response = await fetch(
          `${EXPRESS_API_URL}/nutrition/ingredient/${ri.ingredientId}`,
        );
        const nutrition = (await response.json()) as NutritionData;

        // Scale nutrition by quantity (assuming nutrition is per 100g/unit)
        return {
          calories: nutrition.calories * ri.quantity,
          protein: nutrition.protein * ri.quantity,
          fat: nutrition.fat * ri.quantity,
          carbs: nutrition.carbs * ri.quantity,
        };
      });

      const nutritionData = await Promise.all(nutritionPromises);

      // Aggregate nutrition across all ingredients
      const totalNutrition = nutritionData.reduce(
        (sum, n) => ({
          calories: sum.calories + n.calories,
          protein: sum.protein + n.protein,
          fat: sum.fat + n.fat,
          carbs: sum.carbs + n.carbs,
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0 },
      );

      const caloriesPerServing = totalNutrition.calories / recipe.servings;
      const proteinPerServing = totalNutrition.protein / recipe.servings;
      const fatPerServing = totalNutrition.fat / recipe.servings;
      const carbsPerServing = totalNutrition.carbs / recipe.servings;

      if (activeSpan) {
        activeSpan.setAttributes({
          "nutrition.total_calories": totalNutrition.calories,
          "nutrition.total_protein": totalNutrition.protein,
          "nutrition.total_fat": totalNutrition.fat,
          "nutrition.total_carbs": totalNutrition.carbs,
          "nutrition.calories_per_serving": caloriesPerServing,
          "nutrition.protein_per_serving": proteinPerServing,
          "nutrition.fat_per_serving": fatPerServing,
          "nutrition.carbs_per_serving": carbsPerServing,
        });
      }

      return {
        ...recipe,
        ...totalNutrition,
      };
    },

    recipes: (
      _: unknown,
      { categoryId, difficulty }: { categoryId?: string; difficulty?: string },
    ) => {
      const activeSpan = trace.getActiveSpan();
      const filtersApplied = [];

      let filtered = recipes;
      if (categoryId) {
        filtered = filtered.filter((r) => r.categoryId === categoryId);
        filtersApplied.push("category");
      }
      if (difficulty) {
        filtered = filtered.filter((r) => r.difficulty === difficulty);
        filtersApplied.push("difficulty");
      }

      if (activeSpan) {
        const category = categoryId
          ? categories.find((c) => c.id === categoryId)
          : undefined;
        activeSpan.setAttributes({
          "filter.applied_count": filtersApplied.length,
          "filter.applied": filtersApplied.join(",") || "none",
          "filter.category_id": categoryId || "none",
          "filter.category_name": category?.name || "none",
          "filter.difficulty": difficulty || "none",
          "recipes.total_count": recipes.length,
          "recipes.result_count": filtered.length,
          "recipes.filter_match_rate": filtered.length / recipes.length,
        });
      }

      return filtered;
    },

    searchRecipes: (_: unknown, { query }: { query: string }) => {
      const activeSpan = trace.getActiveSpan();
      const lowerQuery = query.toLowerCase();

      const results = recipes.filter(
        (r) =>
          r.title.toLowerCase().includes(lowerQuery) ||
          r.description.toLowerCase().includes(lowerQuery),
      );

      const titleMatches = results.filter((r) =>
        r.title.toLowerCase().includes(lowerQuery),
      ).length;
      const descriptionMatches = results.filter((r) =>
        r.description.toLowerCase().includes(lowerQuery),
      ).length;

      if (activeSpan) {
        activeSpan.setAttributes({
          "search.query": query,
          "search.query_length": query.length,
          "search.result_count": results.length,
          "search.matched_title_count": titleMatches,
          "search.matched_description_count": descriptionMatches,
          "search.total_recipes": recipes.length,
          "search.match_rate": results.length / recipes.length,
        });
      }

      return results;
    },

    categories: () => categories,

    ingredients: () => ingredients,
  },

  Recipe: {
    category: (recipe: Recipe) => {
      return categories.find((c) => c.id === recipe.categoryId);
    },
    ingredients: (recipe: Recipe) => {
      const recipeIngs = recipeIngredients.filter(
        (ri) => ri.recipeId === recipe.id,
      );
      return recipeIngs.map((ri) => ({
        ingredient: ingredients.find((i) => i.id === ri.ingredientId),
        quantity: ri.quantity,
      }));
    },
  },

  Mutation: {
    createRecipe: (
      _: unknown,
      {
        input,
      }: {
        input: { recipe: Omit<Recipe, "id">; ingredients: RecipeIngredient[] };
      },
    ) => {
      const activeSpan = trace.getActiveSpan();
      const newRecipe: Recipe = {
        id: String(recipeIdCounter++),
        ...input.recipe,
      };
      recipes.push(newRecipe);

      // Add recipe ingredients
      input.ingredients.forEach((ing) => {
        recipeIngredients.push({
          recipeId: newRecipe.id,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
        });
      });

      const category = categories.find((c) => c.id === newRecipe.categoryId);
      const ingredientCategories = [
        ...new Set(
          input.ingredients
            .map((ing) => {
              const ingredient = ingredients.find(
                (i) => i.id === ing.ingredientId,
              );
              return ingredient?.category;
            })
            .filter(Boolean),
        ),
      ];

      if (activeSpan) {
        activeSpan.setAttributes({
          "recipe.created_id": newRecipe.id,
          "recipe.title": newRecipe.title,
          "recipe.category": category?.name || "Unknown",
          "recipe.difficulty": newRecipe.difficulty,
          "recipe.prep_time": newRecipe.prepTime,
          "recipe.cook_time": newRecipe.cookTime,
          "recipe.total_time": newRecipe.prepTime + newRecipe.cookTime,
          "recipe.servings": newRecipe.servings,
          "recipe.ingredient_count": input.ingredients.length,
          "recipe.ingredient_categories": ingredientCategories.join(","),
        });
      }

      return newRecipe;
    },

    updateRecipe: (
      _: unknown,
      { id, recipe }: { id: string; recipe: Omit<Recipe, "id"> },
    ) => {
      const activeSpan = trace.getActiveSpan();
      const index = recipes.findIndex((r) => r.id === id);

      if (index === -1) {
        if (activeSpan) {
          activeSpan.setAttributes({
            "recipe.id": id,
            "recipe.found": false,
          });
        }
        return null;
      }

      const oldRecipe = recipes[index];
      const updatedRecipe = { id, ...recipe };
      recipes[index] = updatedRecipe;

      const fieldsChanged = [];
      if (oldRecipe.title !== updatedRecipe.title) fieldsChanged.push("title");
      if (oldRecipe.description !== updatedRecipe.description)
        fieldsChanged.push("description");
      if (oldRecipe.prepTime !== updatedRecipe.prepTime)
        fieldsChanged.push("prepTime");
      if (oldRecipe.cookTime !== updatedRecipe.cookTime)
        fieldsChanged.push("cookTime");
      if (oldRecipe.difficulty !== updatedRecipe.difficulty)
        fieldsChanged.push("difficulty");
      if (oldRecipe.servings !== updatedRecipe.servings)
        fieldsChanged.push("servings");
      if (oldRecipe.categoryId !== updatedRecipe.categoryId)
        fieldsChanged.push("categoryId");

      const category = categories.find(
        (c) => c.id === updatedRecipe.categoryId,
      );

      if (activeSpan) {
        activeSpan.setAttributes({
          "recipe.id": id,
          "recipe.found": true,
          "recipe.title": updatedRecipe.title,
          "recipe.category": category?.name || "Unknown",
          "recipe.fields_changed": fieldsChanged.join(","),
          "recipe.fields_changed_count": fieldsChanged.length,
          "recipe.category_changed":
            oldRecipe.categoryId !== updatedRecipe.categoryId,
          "recipe.difficulty_changed":
            oldRecipe.difficulty !== updatedRecipe.difficulty,
        });
      }

      return recipes[index];
    },

    deleteRecipe: (_: unknown, { id }: { id: string }) => {
      const activeSpan = trace.getActiveSpan();
      const index = recipes.findIndex((r) => r.id === id);

      if (index === -1) {
        if (activeSpan) {
          activeSpan.setAttributes({
            "recipe.deleted_id": id,
            "recipe.found": false,
            "recipe.deletion_success": false,
          });
        }
        return false;
      }

      const recipe = recipes[index];
      const category = categories.find((c) => c.id === recipe.categoryId);

      recipes.splice(index, 1);
      // Remove associated recipe ingredients
      const ingIndexes = recipeIngredients
        .map((ri, idx) => (ri.recipeId === id ? idx : -1))
        .filter((idx) => idx !== -1)
        .reverse();
      const ingredientRelationshipsDeleted = ingIndexes.length;
      ingIndexes.forEach((idx) => recipeIngredients.splice(idx, 1));

      if (activeSpan) {
        activeSpan.setAttributes({
          "recipe.deleted_id": id,
          "recipe.title": recipe.title,
          "recipe.category": category?.name || "Unknown",
          "recipe.found": true,
          "recipe.deletion_success": true,
          "recipe.ingredient_relationships_deleted":
            ingredientRelationshipsDeleted,
        });
      }

      return true;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    {
      async requestDidStart(): Promise<GraphQLRequestListener<any>> {
        return {
          async didEncounterErrors(requestContext) {
            const activeSpan = trace.getActiveSpan();

            if (activeSpan && requestContext.errors) {
              for (const error of requestContext.errors) {
                activeSpan.recordException(error);
                activeSpan.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: error.message,
                });
              }
            }
          },
        };
      },
    },
  ],
});

await server.start();

const app = express();
const PORT = +(process.env.PORT || "4000");

app.use("/graphql", cors(), express.json(), expressMiddleware(server));

app.listen(PORT);
