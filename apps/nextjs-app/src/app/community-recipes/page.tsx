import Link from "next/link";
import { z } from "zod";
import { getExpressUrl } from "@obs-playground/env";

const communityRecipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  prepTime: z.number(),
  cookTime: z.number(),
  difficulty: z.string(),
  servings: z.number(),
  categoryId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  ingredients: z.array(
    z.object({
      ingredientId: z.string(),
      quantity: z.number(),
    }),
  ),
});

const listResponseSchema = z.object({
  recipes: z.array(communityRecipeSchema),
});

type CommunityRecipe = z.infer<typeof communityRecipeSchema>;

async function getCommunityRecipes(): Promise<CommunityRecipe[]> {
  const response = await fetch(`${getExpressUrl()}/community-recipes`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to load recipes: ${response.status}`);
  }
  const parsed = listResponseSchema.parse(await response.json());
  return parsed.recipes;
}

export default async function CommunityRecipesPage() {
  const recipes = await getCommunityRecipes();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Community Recipes
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Recipes created by anyone, stored in SQLite on Express.
            </p>
          </div>
          <Link
            href="/community-recipes/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Recipe
          </Link>
        </div>

        <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Call Chain:</strong> Next.js &rarr; Express &rarr; SQLite
          </p>
        </div>

        {recipes.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">
              No recipes yet
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Be the first to create one.
            </p>
            <Link
              href="/community-recipes/new"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create a recipe
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/community-recipes/${recipe.id}`}
                className="rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
              >
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {recipe.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {recipe.description || "No description"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                  <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-700">
                    {recipe.difficulty}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-700">
                    Prep: {recipe.prepTime}min
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-700">
                    Cook: {recipe.cookTime}min
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-700">
                    {recipe.ingredients.length} ingredient
                    {recipe.ingredients.length === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
