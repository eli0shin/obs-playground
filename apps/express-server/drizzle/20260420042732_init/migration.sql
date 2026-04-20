CREATE TABLE `community_recipe_ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`recipe_id` text NOT NULL,
	`ingredient_id` text NOT NULL,
	`quantity` real NOT NULL,
	CONSTRAINT `fk_community_recipe_ingredients_recipe_id_community_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `community_recipes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `community_recipes` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`prep_time` integer NOT NULL,
	`cook_time` integer NOT NULL,
	`difficulty` text NOT NULL,
	`servings` integer NOT NULL,
	`category_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
