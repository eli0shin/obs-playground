export const typeDefs = `#graphql
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
