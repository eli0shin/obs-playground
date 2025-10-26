import Link from 'next/link';

import { GRAPHQL_URL } from '@/config';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Recipe = {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  categoryId: string;
};

async function getCategoryAndRecipes(slug: string) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query GetCategoryRecipes {
          categories {
            id
            name
            slug
          }
          recipes {
            id
            title
            description
            prepTime
            cookTime
            difficulty
            servings
            categoryId
          }
        }
      `,
    }),
    cache: 'no-store',
  });

  const { data } = await response.json();
  const category = data.categories.find((c: Category) => c.slug === slug);
  const recipes = category
    ? data.recipes.filter((r: Recipe) => r.categoryId === category.id)
    : [];

  return { category, recipes };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { category, recipes } = await getCategoryAndRecipes(slug);

  if (!category) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Category not found
          </h1>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {category.name} Recipes
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
          </p>
        </header>

        {recipes.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            No recipes found in this category.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe: Recipe) => (
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
        )}
      </div>
    </div>
  );
}
