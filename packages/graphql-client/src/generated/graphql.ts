import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Category = {
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type CreateRecipeInput = {
  ingredients: Array<RecipeIngredientInput>;
  recipe: RecipeInput;
};

export type Ingredient = {
  category: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  unit: Scalars['String']['output'];
};

export type IngredientCost = {
  ingredientId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  pricePerUnit: Scalars['Float']['output'];
  quantity: Scalars['Float']['output'];
  totalCost: Scalars['Float']['output'];
  unit: Scalars['String']['output'];
};

export type Mutation = {
  createRecipe: Recipe;
  deleteRecipe: Scalars['Boolean']['output'];
  errorMutation: Scalars['Boolean']['output'];
  updateRecipe?: Maybe<Recipe>;
  validationErrorMutation: Recipe;
};


export type MutationCreateRecipeArgs = {
  input: CreateRecipeInput;
};


export type MutationDeleteRecipeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationErrorMutationArgs = {
  input: Scalars['String']['input'];
};


export type MutationUpdateRecipeArgs = {
  id: Scalars['ID']['input'];
  recipe: RecipeInput;
};


export type MutationValidationErrorMutationArgs = {
  input: CreateRecipeInput;
};

export type Query = {
  categories: Array<Category>;
  errorQuery?: Maybe<Scalars['String']['output']>;
  ingredients: Array<Ingredient>;
  notFoundRecipe?: Maybe<Recipe>;
  recipe?: Maybe<Recipe>;
  recipeWithCost?: Maybe<RecipeWithCost>;
  recipeWithNutrition?: Maybe<RecipeWithNutrition>;
  recipes: Array<Recipe>;
  searchRecipes: Array<Recipe>;
  secondErrorQuery?: Maybe<Scalars['String']['output']>;
  slowQuery: Scalars['String']['output'];
};


export type QueryRecipeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRecipeWithCostArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRecipeWithNutritionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRecipesArgs = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  difficulty?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySearchRecipesArgs = {
  query: Scalars['String']['input'];
};


export type QuerySlowQueryArgs = {
  delayMs?: InputMaybe<Scalars['Int']['input']>;
};

export type Recipe = {
  category?: Maybe<Category>;
  categoryId: Scalars['String']['output'];
  cookTime: Scalars['Int']['output'];
  description: Scalars['String']['output'];
  difficulty: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ingredients: Array<RecipeIngredientDetail>;
  prepTime: Scalars['Int']['output'];
  servings: Scalars['Int']['output'];
  title: Scalars['String']['output'];
};

export type RecipeIngredientDetail = {
  ingredient: Ingredient;
  quantity: Scalars['Float']['output'];
};

export type RecipeIngredientInput = {
  ingredientId: Scalars['String']['input'];
  quantity: Scalars['Float']['input'];
};

export type RecipeInput = {
  categoryId: Scalars['String']['input'];
  cookTime: Scalars['Int']['input'];
  description: Scalars['String']['input'];
  difficulty: Scalars['String']['input'];
  prepTime: Scalars['Int']['input'];
  servings: Scalars['Int']['input'];
  title: Scalars['String']['input'];
};

export type RecipeWithCost = {
  cookTime: Scalars['Int']['output'];
  description: Scalars['String']['output'];
  difficulty: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ingredientCosts: Array<IngredientCost>;
  prepTime: Scalars['Int']['output'];
  servings: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  totalCost: Scalars['Float']['output'];
};

export type RecipeWithNutrition = {
  calories: Scalars['Float']['output'];
  carbs: Scalars['Float']['output'];
  cookTime: Scalars['Int']['output'];
  description: Scalars['String']['output'];
  difficulty: Scalars['String']['output'];
  fat: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  prepTime: Scalars['Int']['output'];
  protein: Scalars['Float']['output'];
  servings: Scalars['Int']['output'];
  title: Scalars['String']['output'];
};

export type HomeRecipesAndCategoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type HomeRecipesAndCategoriesQuery = { recipes: Array<{ id: string, title: string, description: string, prepTime: number, cookTime: number, difficulty: string, servings: number }>, categories: Array<{ id: string, name: string, slug: string }> };

export type CategoryRecipesListingQueryVariables = Exact<{ [key: string]: never; }>;


export type CategoryRecipesListingQuery = { categories: Array<{ id: string, name: string, slug: string }>, recipes: Array<{ id: string, title: string, description: string, prepTime: number, cookTime: number, difficulty: string, servings: number, categoryId: string }> };

export type RecipeDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RecipeDetailQuery = { recipe?: { id: string, title: string, description: string, prepTime: number, cookTime: number, difficulty: string, servings: number, ingredients: Array<{ quantity: number, ingredient: { id: string, name: string, unit: string } }> } | null };

export type RecipeSummaryByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RecipeSummaryByIdQuery = { recipe?: { id: string, title: string } | null };

export type RecipeWithCostDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RecipeWithCostDetailQuery = { recipeWithCost?: { id: string, title: string, description: string, prepTime: number, cookTime: number, difficulty: string, servings: number, totalCost: number, ingredientCosts: Array<{ ingredientId: string, name: string, quantity: number, unit: string, pricePerUnit: number, totalCost: number }> } | null };

export type RecipeWithNutritionDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RecipeWithNutritionDetailQuery = { recipeWithNutrition?: { id: string, title: string, description: string, prepTime: number, cookTime: number, difficulty: string, servings: number, calories: number, protein: number, fat: number, carbs: number } | null };

export type CategoriesAndIngredientsQueryVariables = Exact<{ [key: string]: never; }>;


export type CategoriesAndIngredientsQuery = { categories: Array<{ id: string, name: string, slug: string }>, ingredients: Array<{ id: string, name: string, unit: string }> };

export type CreateRecipeMutationVariables = Exact<{
  input: CreateRecipeInput;
}>;


export type CreateRecipeMutation = { createRecipe: { id: string, title: string, description: string } };

export type UpdateRecipeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  recipe: RecipeInput;
}>;


export type UpdateRecipeMutation = { updateRecipe?: { id: string, title: string, description: string } | null };

export type DeleteRecipeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteRecipeMutation = { deleteRecipe: boolean };

export type RecipeQueryWithUnusedVariableQueryVariables = Exact<{
  unusedVariable: Scalars['ID']['input'];
}>;


export type RecipeQueryWithUnusedVariableQuery = { recipes: Array<{ id: string, title: string }> };

export type ErrorMutationMutationVariables = Exact<{ [key: string]: never; }>;


export type ErrorMutationMutation = { errorMutation: boolean };

export type ValidationErrorMutationMutationVariables = Exact<{ [key: string]: never; }>;


export type ValidationErrorMutationMutation = { validationErrorMutation: { id: string, title: string } };

export type ErrorQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type ErrorQueryQuery = { errorQuery?: string | null };

export type MultipleErrorsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type MultipleErrorsQueryQuery = { errorQuery?: string | null, secondErrorQuery?: string | null, recipes: Array<{ id: string, title: string }> };

export type NotFoundRecipeQueryVariables = Exact<{ [key: string]: never; }>;


export type NotFoundRecipeQuery = { notFoundRecipe?: { id: string, title: string, description: string } | null };


export const HomeRecipesAndCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HomeRecipesAndCategories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recipes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"prepTime"}},{"kind":"Field","name":{"kind":"Name","value":"cookTime"}},{"kind":"Field","name":{"kind":"Name","value":"difficulty"}},{"kind":"Field","name":{"kind":"Name","value":"servings"}}]}},{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<HomeRecipesAndCategoriesQuery, HomeRecipesAndCategoriesQueryVariables>;
export const CategoryRecipesListingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CategoryRecipesListing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recipes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"prepTime"}},{"kind":"Field","name":{"kind":"Name","value":"cookTime"}},{"kind":"Field","name":{"kind":"Name","value":"difficulty"}},{"kind":"Field","name":{"kind":"Name","value":"servings"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}}]}}]}}]} as unknown as DocumentNode<CategoryRecipesListingQuery, CategoryRecipesListingQueryVariables>;
export const RecipeDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecipeDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recipe"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"prepTime"}},{"kind":"Field","name":{"kind":"Name","value":"cookTime"}},{"kind":"Field","name":{"kind":"Name","value":"difficulty"}},{"kind":"Field","name":{"kind":"Name","value":"servings"}},{"kind":"Field","name":{"kind":"Name","value":"ingredients"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ingredient"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}}]}}]}}]}}]} as unknown as DocumentNode<RecipeDetailQuery, RecipeDetailQueryVariables>;
export const RecipeSummaryByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecipeSummaryById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recipe"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]} as unknown as DocumentNode<RecipeSummaryByIdQuery, RecipeSummaryByIdQueryVariables>;
export const RecipeWithCostDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecipeWithCostDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recipeWithCost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"prepTime"}},{"kind":"Field","name":{"kind":"Name","value":"cookTime"}},{"kind":"Field","name":{"kind":"Name","value":"difficulty"}},{"kind":"Field","name":{"kind":"Name","value":"servings"}},{"kind":"Field","name":{"kind":"Name","value":"ingredientCosts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ingredientId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"pricePerUnit"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}}]}}]}}]} as unknown as DocumentNode<RecipeWithCostDetailQuery, RecipeWithCostDetailQueryVariables>;
export const RecipeWithNutritionDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecipeWithNutritionDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recipeWithNutrition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"prepTime"}},{"kind":"Field","name":{"kind":"Name","value":"cookTime"}},{"kind":"Field","name":{"kind":"Name","value":"difficulty"}},{"kind":"Field","name":{"kind":"Name","value":"servings"}},{"kind":"Field","name":{"kind":"Name","value":"calories"}},{"kind":"Field","name":{"kind":"Name","value":"protein"}},{"kind":"Field","name":{"kind":"Name","value":"fat"}},{"kind":"Field","name":{"kind":"Name","value":"carbs"}}]}}]}}]} as unknown as DocumentNode<RecipeWithNutritionDetailQuery, RecipeWithNutritionDetailQueryVariables>;
export const CategoriesAndIngredientsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CategoriesAndIngredients"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}},{"kind":"Field","name":{"kind":"Name","value":"ingredients"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}}]} as unknown as DocumentNode<CategoriesAndIngredientsQuery, CategoriesAndIngredientsQueryVariables>;
export const CreateRecipeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRecipe"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRecipeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRecipe"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<CreateRecipeMutation, CreateRecipeMutationVariables>;
export const UpdateRecipeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRecipe"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recipe"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RecipeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRecipe"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"recipe"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recipe"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<UpdateRecipeMutation, UpdateRecipeMutationVariables>;
export const DeleteRecipeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRecipe"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRecipe"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteRecipeMutation, DeleteRecipeMutationVariables>;
export const RecipeQueryWithUnusedVariableDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecipeQueryWithUnusedVariable"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"unusedVariable"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recipes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]} as unknown as DocumentNode<RecipeQueryWithUnusedVariableQuery, RecipeQueryWithUnusedVariableQueryVariables>;
export const ErrorMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ErrorMutation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errorMutation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"StringValue","value":"test","block":false}}]}]}}]} as unknown as DocumentNode<ErrorMutationMutation, ErrorMutationMutationVariables>;
export const ValidationErrorMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ValidationErrorMutation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validationErrorMutation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"recipe"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"title"},"value":{"kind":"StringValue","value":"Short","block":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"StringValue","value":"Test","block":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"prepTime"},"value":{"kind":"IntValue","value":"-5"}},{"kind":"ObjectField","name":{"kind":"Name","value":"cookTime"},"value":{"kind":"IntValue","value":"10"}},{"kind":"ObjectField","name":{"kind":"Name","value":"difficulty"},"value":{"kind":"StringValue","value":"Easy","block":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"servings"},"value":{"kind":"IntValue","value":"4"}},{"kind":"ObjectField","name":{"kind":"Name","value":"categoryId"},"value":{"kind":"StringValue","value":"1","block":false}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"ingredients"},"value":{"kind":"ListValue","values":[]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]} as unknown as DocumentNode<ValidationErrorMutationMutation, ValidationErrorMutationMutationVariables>;
export const ErrorQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ErrorQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errorQuery"}}]}}]} as unknown as DocumentNode<ErrorQueryQuery, ErrorQueryQueryVariables>;
export const MultipleErrorsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MultipleErrorsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recipes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errorQuery"}},{"kind":"Field","name":{"kind":"Name","value":"secondErrorQuery"}}]}}]} as unknown as DocumentNode<MultipleErrorsQueryQuery, MultipleErrorsQueryQueryVariables>;
export const NotFoundRecipeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NotFoundRecipe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notFoundRecipe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<NotFoundRecipeQuery, NotFoundRecipeQueryVariables>;