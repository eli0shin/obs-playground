import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const communityRecipes = sqliteTable("community_recipes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  prepTime: integer("prep_time").notNull(),
  cookTime: integer("cook_time").notNull(),
  difficulty: text("difficulty").notNull(),
  servings: integer("servings").notNull(),
  categoryId: text("category_id").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const communityRecipeIngredients = sqliteTable(
  "community_recipe_ingredients",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => communityRecipes.id, { onDelete: "cascade" }),
    ingredientId: text("ingredient_id").notNull(),
    quantity: real("quantity").notNull(),
  },
);

export type CommunityRecipeRow = typeof communityRecipes.$inferSelect;
export type CommunityRecipeInsert = typeof communityRecipes.$inferInsert;
export type CommunityRecipeIngredientRow =
  typeof communityRecipeIngredients.$inferSelect;
export type CommunityRecipeIngredientInsert =
  typeof communityRecipeIngredients.$inferInsert;
