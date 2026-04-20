import Link from "next/link";
import { graphqlRequest } from "@obs-playground/graphql-client";
import { getExpressUrl } from "@obs-playground/env";
import { deleteCommunityRecipeAction } from "../actions";
import { communityRecipeSchema, type CommunityRecipe } from "../schema";

type IngredientInfo = { id: string; name: string; unit: string };

async function getCommunityRecipe(id: string): Promise<CommunityRecipe | null> {
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

async function getIngredientIndex(): Promise<Map<string, IngredientInfo>> {
  const { ingredients } = await graphqlRequest<{
    ingredients: IngredientInfo[];
  }>(
    `
      query GetIngredients {
        ingredients {
          id
          name
          unit
        }
      }
    `,
  );
  return new Map(ingredients.map((i) => [i.id, i]));
}

export default async function CommunityRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [recipe, ingredientIndex] = await Promise.all([
    getCommunityRecipe(id),
    getIngredientIndex(),
  ]);

  if (!recipe) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Recipe not found
          </h1>
          <Link
            href="/community-recipes"
            className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
          >
            Back to community recipes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/community-recipes"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to community recipes
        </Link>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                {recipe.title}
              </h1>
              {recipe.description ? (
                <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                  {recipe.description}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-700">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Difficulty: {recipe.difficulty}
                  </span>
                </div>
                <div className="rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-700">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Prep: {recipe.prepTime} min
                  </span>
                </div>
                <div className="rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-700">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Cook: {recipe.cookTime} min
                  </span>
                </div>
                <div className="rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-700">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Serves: {recipe.servings}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href={`/community-recipes/${recipe.id}/edit`}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Edit
              </Link>
              <form action={deleteCommunityRecipeAction.bind(null, recipe.id)}>
                <button
                  type="submit"
                  className="w-full rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                >
                  Delete
                </button>
              </form>
            </div>
          </header>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Ingredients
            </h2>
            {recipe.ingredients.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No ingredients saved for this recipe.
              </p>
            ) : (
              <ul className="space-y-2">
                {recipe.ingredients.map((entry) => {
                  const info = ingredientIndex.get(entry.ingredientId);
                  const label = info
                    ? `${entry.quantity} ${info.unit} ${info.name}`
                    : `${entry.quantity} units of ingredient #${entry.ingredientId}`;
                  return (
                    <li
                      key={entry.ingredientId}
                      className="flex items-center text-zinc-700 dark:text-zinc-300"
                    >
                      <span className="mr-2 h-2 w-2 rounded-full bg-blue-500" />
                      <span>{label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <footer className="border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <p>
              Created: {recipe.createdAt} &middot; Updated: {recipe.updatedAt}
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
