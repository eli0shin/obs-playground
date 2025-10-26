import Link from "next/link";

import { GRAPHQL_URL } from "@/config";

type RecipeWithNutrition = {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

async function getRecipeWithNutrition(id: string) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query GetRecipeWithNutrition($id: ID!) {
          recipeWithNutrition(id: $id) {
            id
            title
            description
            prepTime
            cookTime
            difficulty
            servings
            calories
            protein
            fat
            carbs
          }
        }
      `,
      variables: { id },
    }),
    cache: "no-store",
  });

  const { data } = await response.json();
  return data.recipeWithNutrition as RecipeWithNutrition;
}

export default async function RecipeNutritionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipeWithNutrition(id);

  if (!recipe) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Recipe not found
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

  const caloriesPerServing = Math.round(recipe.calories / recipe.servings);
  const proteinPerServing =
    Math.round((recipe.protein / recipe.servings) * 10) / 10;
  const fatPerServing = Math.round((recipe.fat / recipe.servings) * 10) / 10;
  const carbsPerServing =
    Math.round((recipe.carbs / recipe.servings) * 10) / 10;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href={`/recipes/${id}`}
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to recipe
        </Link>

        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Call Chain:</strong> Next.js &rarr; GraphQL &rarr; Express
          </p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
            GraphQL resolver fetches recipe data and calls Express API for
            nutrition information
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              {recipe.title}
            </h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              {recipe.description}
            </p>

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
          </header>

          <section className="mb-8">
            <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Nutrition Facts
            </h2>

            <div className="mb-6 rounded-lg border-2 border-zinc-900 bg-white p-6 dark:border-zinc-200 dark:bg-zinc-800">
              <div className="border-b-8 border-zinc-900 pb-2 dark:border-zinc-200">
                <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  Nutrition Facts
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {recipe.servings} servings per recipe
                </p>
              </div>

              <div className="border-b-4 border-zinc-900 py-2 dark:border-zinc-200">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Serving size: 1 portion
                </p>
              </div>

              <div className="border-b-4 border-zinc-900 py-4 dark:border-zinc-200">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    Calories
                  </span>
                  <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                    {caloriesPerServing}
                  </span>
                </div>
              </div>

              <div className="py-2 text-sm">
                <div className="border-b border-zinc-300 py-2 dark:border-zinc-600">
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-900 dark:text-zinc-50">
                      Total Fat
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-50">
                      {fatPerServing}g
                    </span>
                  </div>
                </div>

                <div className="border-b border-zinc-300 py-2 dark:border-zinc-600">
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-900 dark:text-zinc-50">
                      Total Carbohydrate
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-50">
                      {carbsPerServing}g
                    </span>
                  </div>
                </div>

                <div className="border-b-4 border-zinc-900 py-2 dark:border-zinc-200">
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-900 dark:text-zinc-50">
                      Protein
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-50">
                      {proteinPerServing}g
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
              <h4 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                Total Recipe Nutrition
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400">Calories</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {recipe.calories}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400">Protein</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {recipe.protein}g
                  </p>
                </div>
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400">Fat</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {recipe.fat}g
                  </p>
                </div>
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400">Carbs</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {recipe.carbs}g
                  </p>
                </div>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
