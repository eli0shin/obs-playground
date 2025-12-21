import Link from "next/link";
import { graphqlRequest } from "@obs-playground/graphql-client";

const EXPRESS_URL = process.env.EXPRESS_BASE_URL || "http://localhost:3001";

type FetchResult = {
  name: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
};

async function fetchRecipe1() {
  try {
    const data = await graphqlRequest<{
      recipe: { id: string; title: string };
    }>(`query { recipe(id: "1") { id title } }`);
    return { name: "Recipe 1 (Success)", success: true, data };
  } catch (error) {
    return {
      name: "Recipe 1",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function fetchNonExistentRecipe() {
  try {
    const data = await graphqlRequest<{
      notFoundRecipe: { id: string; title: string } | null;
    }>(`query { notFoundRecipe { id title } }`);

    if (!data.notFoundRecipe) {
      throw new Error("Recipe not found");
    }

    return { name: "Not Found Recipe", success: true, data };
  } catch (error) {
    return {
      name: "Not Found Recipe (Expected Failure)",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function fetchExpressError() {
  try {
    const response = await fetch(`${EXPRESS_URL}/api/error/test`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { name: "Express Error", success: true, data };
  } catch (error) {
    return {
      name: "Express Error (Expected Failure)",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function fetchRecipe2() {
  try {
    const data = await graphqlRequest<{
      recipe: { id: string; title: string };
    }>(`query { recipe(id: "2") { id title } }`);
    return { name: "Recipe 2 (Success)", success: true, data };
  } catch (error) {
    return {
      name: "Recipe 2",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runPartialFailureTest() {
  const results = await Promise.allSettled([
    fetchRecipe1(),
    fetchNonExistentRecipe(),
    fetchExpressError(),
    fetchRecipe2(),
  ]);

  const processedResults: FetchResult[] = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        name: `Request ${index + 1}`,
        success: false,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : "Unknown error",
      };
    }
  });

  return processedResults;
}

export default async function PartialFailurePage() {
  const results = await runPartialFailureTest();

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/testing/errors"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to error testing
        </Link>

        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            <strong>Partial Failure Test:</strong> {successCount} succeeded,{" "}
            {failureCount} failed
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Partial Failure Test Results
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            This page makes 4 parallel requests, 2 succeed and 2 fail
          </p>

          <div className="mt-6 space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${
                  result.success
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                    {result.name}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      result.success
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                    }`}
                  >
                    {result.success ? "Success" : "Failed"}
                  </span>
                </div>
                {result.error && (
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                    Error: {result.error}
                  </p>
                )}
                {result.data && (
                  <pre className="mt-2 overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
