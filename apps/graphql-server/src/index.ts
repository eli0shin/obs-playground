import './otel.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import cors from 'cors';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:3001';

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
  { id: '1', name: 'Breakfast', slug: 'breakfast' },
  { id: '2', name: 'Lunch', slug: 'lunch' },
  { id: '3', name: 'Dinner', slug: 'dinner' },
  { id: '4', name: 'Dessert', slug: 'dessert' },
  { id: '5', name: 'Snacks', slug: 'snacks' },
];

const ingredients: Ingredient[] = [
  { id: '1', name: 'Eggs', category: 'Protein', unit: 'piece' },
  { id: '2', name: 'Flour', category: 'Grains', unit: 'cup' },
  { id: '3', name: 'Milk', category: 'Dairy', unit: 'cup' },
  { id: '4', name: 'Sugar', category: 'Sweeteners', unit: 'cup' },
  { id: '5', name: 'Butter', category: 'Dairy', unit: 'tablespoon' },
  { id: '6', name: 'Chicken Breast', category: 'Protein', unit: 'pound' },
  { id: '7', name: 'Rice', category: 'Grains', unit: 'cup' },
  { id: '8', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
  { id: '9', name: 'Onion', category: 'Vegetables', unit: 'piece' },
  { id: '10', name: 'Garlic', category: 'Vegetables', unit: 'clove' },
];

const recipes: Recipe[] = [
  {
    id: '1',
    title: 'Pancakes',
    description: 'Fluffy breakfast pancakes',
    prepTime: 10,
    cookTime: 15,
    difficulty: 'Easy',
    servings: 4,
    categoryId: '1',
  },
  {
    id: '2',
    title: 'Chicken Fried Rice',
    description: 'Classic Asian-style fried rice with chicken',
    prepTime: 15,
    cookTime: 20,
    difficulty: 'Medium',
    servings: 4,
    categoryId: '3',
  },
  {
    id: '3',
    title: 'Garlic Butter Chicken',
    description: 'Tender chicken with garlic butter sauce',
    prepTime: 10,
    cookTime: 25,
    difficulty: 'Medium',
    servings: 4,
    categoryId: '3',
  },
];

const recipeIngredients: RecipeIngredient[] = [
  // Pancakes
  { recipeId: '1', ingredientId: '1', quantity: 2 },
  { recipeId: '1', ingredientId: '2', quantity: 1.5 },
  { recipeId: '1', ingredientId: '3', quantity: 1 },
  { recipeId: '1', ingredientId: '4', quantity: 0.25 },
  { recipeId: '1', ingredientId: '5', quantity: 2 },
  // Chicken Fried Rice
  { recipeId: '2', ingredientId: '6', quantity: 1 },
  { recipeId: '2', ingredientId: '7', quantity: 2 },
  { recipeId: '2', ingredientId: '1', quantity: 2 },
  { recipeId: '2', ingredientId: '9', quantity: 1 },
  { recipeId: '2', ingredientId: '10', quantity: 3 },
  // Garlic Butter Chicken
  { recipeId: '3', ingredientId: '6', quantity: 1.5 },
  { recipeId: '3', ingredientId: '5', quantity: 4 },
  { recipeId: '3', ingredientId: '10', quantity: 6 },
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
      const recipe = recipes.find((r) => r.id === id);
      if (!recipe) return null;

      const recipeIngs = recipeIngredients.filter((ri) => ri.recipeId === id);
      const ingredientIds = recipeIngs.map((ri) => ri.ingredientId);

      // Call Express API to get pricing
      const response = await fetch(
        `${EXPRESS_API_URL}/ingredients/prices?ids=${ingredientIds.join(',')}`
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

      const totalCost = ingredientCosts.reduce((sum, ic) => sum + ic.totalCost, 0);

      return {
        ...recipe,
        ingredientCosts,
        totalCost,
      };
    },

    recipeWithNutrition: async (_: unknown, { id }: { id: string }) => {
      const recipe = recipes.find((r) => r.id === id);
      if (!recipe) return null;

      const recipeIngs = recipeIngredients.filter((ri) => ri.recipeId === id);

      // Call Express API to get nutrition for each ingredient
      const nutritionPromises = recipeIngs.map(async (ri) => {
        const response = await fetch(
          `${EXPRESS_API_URL}/nutrition/ingredient/${ri.ingredientId}`
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
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
      );

      return {
        ...recipe,
        ...totalNutrition,
      };
    },

    recipes: (
      _: unknown,
      { categoryId, difficulty }: { categoryId?: string; difficulty?: string }
    ) => {
      let filtered = recipes;
      if (categoryId) {
        filtered = filtered.filter((r) => r.categoryId === categoryId);
      }
      if (difficulty) {
        filtered = filtered.filter((r) => r.difficulty === difficulty);
      }
      return filtered;
    },

    searchRecipes: (_: unknown, { query }: { query: string }) => {
      const lowerQuery = query.toLowerCase();
      return recipes.filter(
        (r) =>
          r.title.toLowerCase().includes(lowerQuery) ||
          r.description.toLowerCase().includes(lowerQuery)
      );
    },

    categories: () => categories,

    ingredients: () => ingredients,
  },

  Recipe: {
    category: (recipe: Recipe) => {
      return categories.find((c) => c.id === recipe.categoryId);
    },
    ingredients: (recipe: Recipe) => {
      const recipeIngs = recipeIngredients.filter((ri) => ri.recipeId === recipe.id);
      return recipeIngs.map((ri) => ({
        ingredient: ingredients.find((i) => i.id === ri.ingredientId),
        quantity: ri.quantity,
      }));
    },
  },

  Mutation: {
    createRecipe: (
      _: unknown,
      { input }: { input: { recipe: Omit<Recipe, 'id'>; ingredients: RecipeIngredient[] } }
    ) => {
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

      return newRecipe;
    },

    updateRecipe: (
      _: unknown,
      { id, recipe }: { id: string; recipe: Omit<Recipe, 'id'> }
    ) => {
      const index = recipes.findIndex((r) => r.id === id);
      if (index === -1) return null;

      recipes[index] = { id, ...recipe };
      return recipes[index];
    },

    deleteRecipe: (_: unknown, { id }: { id: string }) => {
      const index = recipes.findIndex((r) => r.id === id);
      if (index === -1) return false;

      recipes.splice(index, 1);
      // Remove associated recipe ingredients
      const ingIndexes = recipeIngredients
        .map((ri, idx) => (ri.recipeId === id ? idx : -1))
        .filter((idx) => idx !== -1)
        .reverse();
      ingIndexes.forEach((idx) => recipeIngredients.splice(idx, 1));

      return true;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

const app = express();
const PORT = +(process.env.PORT || '4000');

app.use(
  '/graphql',
  cors(),
  express.json(),
  expressMiddleware(server),
);

app.listen(PORT, () => {
  console.log(`GraphQL Server ready at: http://localhost:${PORT}/graphql`);
});
