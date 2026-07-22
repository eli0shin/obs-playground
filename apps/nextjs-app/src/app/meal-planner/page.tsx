import Link from "next/link";
import { MealPlannerForm } from "./meal-planner-form";

export default function MealPlannerPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Generate a Meal Plan
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Submit planning constraints and let the system build a valid meal
              plan.
            </p>
          </header>

          <MealPlannerForm />
        </article>
      </div>
    </div>
  );
}
