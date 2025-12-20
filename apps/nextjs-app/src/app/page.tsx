import Link from "next/link";
import { graphqlRequest } from "@obs-playground/graphql-client";

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
  return graphqlRequest<{ recipes: Recipe[]; categories: Category[] }>(`
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
  `);
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

        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Telemetry Testing
          </h2>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Test pages for observability and error tracking scenarios
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/testing/errors"
              className="rounded-lg border border-red-200 bg-red-50 p-6 transition-colors hover:border-red-300 dark:border-red-800 dark:bg-red-950 dark:hover:border-red-700"
            >
              <h3 className="text-lg font-medium text-red-900 dark:text-red-100">
                Error Scenarios
              </h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                Pages that fail: 500, 404, timeouts, Suspense errors
              </p>
            </Link>
            <Link
              href="/recipes/new"
              className="rounded-lg border border-green-200 bg-green-50 p-6 transition-colors hover:border-green-300 dark:border-green-800 dark:bg-green-950 dark:hover:border-green-700"
            >
              <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
                Server Actions
              </h3>
              <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                Create recipe form with Server Action
              </p>
            </Link>
            <Link
              href="/testing/forms/broken-create"
              className="rounded-lg border border-orange-200 bg-orange-50 p-6 transition-colors hover:border-orange-300 dark:border-orange-800 dark:bg-orange-950 dark:hover:border-orange-700"
            >
              <h3 className="text-lg font-medium text-orange-900 dark:text-orange-100">
                Broken Form
              </h3>
              <p className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                Server Action that always fails
              </p>
            </Link>
            <Link
              href="/testing/client/broken-api"
              className="rounded-lg border border-purple-200 bg-purple-50 p-6 transition-colors hover:border-purple-300 dark:border-purple-800 dark:bg-purple-950 dark:hover:border-purple-700"
            >
              <h3 className="text-lg font-medium text-purple-900 dark:text-purple-100">
                Client API Calls
              </h3>
              <p className="mt-2 text-sm text-purple-700 dark:text-purple-300">
                Express API calls from browser that fail
              </p>
            </Link>
            <Link
              href="/testing/client/broken-mutation"
              className="rounded-lg border border-blue-200 bg-blue-50 p-6 transition-colors hover:border-blue-300 dark:border-blue-800 dark:bg-blue-950 dark:hover:border-blue-700"
            >
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                Client GraphQL
              </h3>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                GraphQL mutations from browser that fail
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
