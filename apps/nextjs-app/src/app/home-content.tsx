"use client";

import Link from "next/link";
import { trpc } from "@/trpc/client";

export function HomeContent() {
  const { data, error, isLoading } = trpc.home.recipesAndCategories.useQuery();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
        Loading recipes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        Failed to load recipes: {error.message}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Browse by Category
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.categories.map((category) => (
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
          {data.recipes.map((recipe) => (
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
    </>
  );
}
