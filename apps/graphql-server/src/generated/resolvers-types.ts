import type { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Category = {
  __typename?: 'Category';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type CreateRecipeInput = {
  ingredients: Array<RecipeIngredientInput>;
  recipe: RecipeInput;
};

export type Ingredient = {
  __typename?: 'Ingredient';
  category: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  unit: Scalars['String']['output'];
};

export type IngredientCost = {
  __typename?: 'IngredientCost';
  ingredientId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  pricePerUnit: Scalars['Float']['output'];
  quantity: Scalars['Float']['output'];
  totalCost: Scalars['Float']['output'];
  unit: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
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
  __typename?: 'Query';
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
  __typename?: 'Recipe';
  category?: Maybe<Category>;
  categoryId: Scalars['String']['output'];
  cookTime: Scalars['Int']['output'];
  createdAt: Scalars['String']['output'];
  description: Scalars['String']['output'];
  difficulty: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ingredients: Array<RecipeIngredientDetail>;
  prepTime: Scalars['Int']['output'];
  servings: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type RecipeIngredientDetail = {
  __typename?: 'RecipeIngredientDetail';
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
  __typename?: 'RecipeWithCost';
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
  __typename?: 'RecipeWithNutrition';
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

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Category: ResolverTypeWrapper<Category>;
  CreateRecipeInput: CreateRecipeInput;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Ingredient: ResolverTypeWrapper<Ingredient>;
  IngredientCost: ResolverTypeWrapper<IngredientCost>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Recipe: ResolverTypeWrapper<Recipe>;
  RecipeIngredientDetail: ResolverTypeWrapper<RecipeIngredientDetail>;
  RecipeIngredientInput: RecipeIngredientInput;
  RecipeInput: RecipeInput;
  RecipeWithCost: ResolverTypeWrapper<RecipeWithCost>;
  RecipeWithNutrition: ResolverTypeWrapper<RecipeWithNutrition>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  Category: Category;
  CreateRecipeInput: CreateRecipeInput;
  Float: Scalars['Float']['output'];
  ID: Scalars['ID']['output'];
  Ingredient: Ingredient;
  IngredientCost: IngredientCost;
  Int: Scalars['Int']['output'];
  Mutation: Record<PropertyKey, never>;
  Query: Record<PropertyKey, never>;
  Recipe: Recipe;
  RecipeIngredientDetail: RecipeIngredientDetail;
  RecipeIngredientInput: RecipeIngredientInput;
  RecipeInput: RecipeInput;
  RecipeWithCost: RecipeWithCost;
  RecipeWithNutrition: RecipeWithNutrition;
  String: Scalars['String']['output'];
}>;

export type CategoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Category'] = ResolversParentTypes['Category']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type IngredientResolvers<ContextType = any, ParentType extends ResolversParentTypes['Ingredient'] = ResolversParentTypes['Ingredient']> = ResolversObject<{
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  unit?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type IngredientCostResolvers<ContextType = any, ParentType extends ResolversParentTypes['IngredientCost'] = ResolversParentTypes['IngredientCost']> = ResolversObject<{
  ingredientId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pricePerUnit?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalCost?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  unit?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  createRecipe?: Resolver<ResolversTypes['Recipe'], ParentType, ContextType, RequireFields<MutationCreateRecipeArgs, 'input'>>;
  deleteRecipe?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteRecipeArgs, 'id'>>;
  errorMutation?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationErrorMutationArgs, 'input'>>;
  updateRecipe?: Resolver<Maybe<ResolversTypes['Recipe']>, ParentType, ContextType, RequireFields<MutationUpdateRecipeArgs, 'id' | 'recipe'>>;
  validationErrorMutation?: Resolver<ResolversTypes['Recipe'], ParentType, ContextType, RequireFields<MutationValidationErrorMutationArgs, 'input'>>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  categories?: Resolver<Array<ResolversTypes['Category']>, ParentType, ContextType>;
  errorQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ingredients?: Resolver<Array<ResolversTypes['Ingredient']>, ParentType, ContextType>;
  notFoundRecipe?: Resolver<Maybe<ResolversTypes['Recipe']>, ParentType, ContextType>;
  recipe?: Resolver<Maybe<ResolversTypes['Recipe']>, ParentType, ContextType, RequireFields<QueryRecipeArgs, 'id'>>;
  recipeWithCost?: Resolver<Maybe<ResolversTypes['RecipeWithCost']>, ParentType, ContextType, RequireFields<QueryRecipeWithCostArgs, 'id'>>;
  recipeWithNutrition?: Resolver<Maybe<ResolversTypes['RecipeWithNutrition']>, ParentType, ContextType, RequireFields<QueryRecipeWithNutritionArgs, 'id'>>;
  recipes?: Resolver<Array<ResolversTypes['Recipe']>, ParentType, ContextType, Partial<QueryRecipesArgs>>;
  searchRecipes?: Resolver<Array<ResolversTypes['Recipe']>, ParentType, ContextType, RequireFields<QuerySearchRecipesArgs, 'query'>>;
  secondErrorQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  slowQuery?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<QuerySlowQueryArgs>>;
}>;

export type RecipeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Recipe'] = ResolversParentTypes['Recipe']> = ResolversObject<{
  category?: Resolver<Maybe<ResolversTypes['Category']>, ParentType, ContextType>;
  categoryId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  cookTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  difficulty?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  ingredients?: Resolver<Array<ResolversTypes['RecipeIngredientDetail']>, ParentType, ContextType>;
  prepTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  servings?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type RecipeIngredientDetailResolvers<ContextType = any, ParentType extends ResolversParentTypes['RecipeIngredientDetail'] = ResolversParentTypes['RecipeIngredientDetail']> = ResolversObject<{
  ingredient?: Resolver<ResolversTypes['Ingredient'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
}>;

export type RecipeWithCostResolvers<ContextType = any, ParentType extends ResolversParentTypes['RecipeWithCost'] = ResolversParentTypes['RecipeWithCost']> = ResolversObject<{
  cookTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  difficulty?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  ingredientCosts?: Resolver<Array<ResolversTypes['IngredientCost']>, ParentType, ContextType>;
  prepTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  servings?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalCost?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
}>;

export type RecipeWithNutritionResolvers<ContextType = any, ParentType extends ResolversParentTypes['RecipeWithNutrition'] = ResolversParentTypes['RecipeWithNutrition']> = ResolversObject<{
  calories?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  carbs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  cookTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  difficulty?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fat?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  prepTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  protein?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  servings?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  Category?: CategoryResolvers<ContextType>;
  Ingredient?: IngredientResolvers<ContextType>;
  IngredientCost?: IngredientCostResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Recipe?: RecipeResolvers<ContextType>;
  RecipeIngredientDetail?: RecipeIngredientDetailResolvers<ContextType>;
  RecipeWithCost?: RecipeWithCostResolvers<ContextType>;
  RecipeWithNutrition?: RecipeWithNutritionResolvers<ContextType>;
}>;

