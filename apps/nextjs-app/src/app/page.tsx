import Link from "next/link";
import { GRAPHQL_URL } from "@/config";

type Recipe = {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

async function getRecipesAndCategories() {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query GetRecipesAndCategories {
          recipes {
            id
            title
            description
            prepTime
            cookTime
            difficulty
            servings
          }
          categories {
            id
            name
            slug
          }
        }
      `,
    }),
    cache: "no-store",
  });

  const { data } = await response.json();
  return data as { recipes: Recipe[]; categories: Category[] };
}

export default async function Home() {
  const { recipes, categories } = await getRecipesAndCategories();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Recipe &amp; Meal Planning
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            OpenTelemetry Playground - Browse recipes and plan your meals
          </p>
        </header>

        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Browse by Category
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
              >
                <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            All Recipes
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
              >
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {recipe.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {recipe.description}
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
                    Serves {recipe.servings}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Plan Your Meals
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/shopping-list"
              className="rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
            >
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Shopping List Generator
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Create a shopping list from selected recipes
              </p>
            </Link>
            <Link
              href="/meal-planner"
              className="rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
            >
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Weekly Meal Planner
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Plan your weekly meals and estimate costs
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
