"use client";

import { useState } from "react";
import Link from "next/link";
import { graphqlRequest } from "@obs-playground/graphql-client/browser";

export default function BrokenMutationPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<Record<string, unknown> | null>(
    null,
  );

  const handleErrorMutation = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await graphqlRequest<{ errorMutation: string }>(
        `
          mutation ErrorMutation {
            errorMutation(input: "test")
          }
        `,
      );
      if (result.errors && result.errors.length > 0) {
        setError(JSON.stringify(result.errors));
      }
      if (result.data) {
        setResponse(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleValidationMutation = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await graphqlRequest<{
        validationErrorMutation: { id: string; title: string };
      }>(
        `
          mutation ValidationError {
            validationErrorMutation(input: {
              recipe: {
                title: "Short"
                description: "Test"
                prepTime: -5
                cookTime: 10
                difficulty: "Easy"
                servings: 4
                categoryId: "1"
              }
              ingredients: []
            }) {
              id
              title
            }
          }
        `,
      );
      if (result.errors && result.errors.length > 0) {
        setError(JSON.stringify(result.errors));
      }
      if (result.data) {
        setResponse(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleErrorQuery = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await graphqlRequest<{ errorQuery: string }>(
        `
          query ErrorQuery {
            errorQuery
          }
        `,
      );
      if (result.errors && result.errors.length > 0) {
        setError(JSON.stringify(result.errors));
      }
      if (result.data) {
        setResponse(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSchemaValidationError = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await graphqlRequest<{
        recipes: Array<{ id: string; title: string }>;
      }>(
        `
          query RecipeQuery($unusedVariable: ID!) {
            recipes {
              id
              title
            }
          }
        `,
        {
          unusedVariable: "recipe-1",
        },
      );
      if (result.errors && result.errors.length > 0) {
        setError(JSON.stringify(result.errors));
      }
      if (result.data) {
        setResponse(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleErrorsQuery = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await graphqlRequest<{
        recipes: Array<{ id: string; title: string }>;
        errorQuery: string;
        secondErrorQuery: string;
      }>(
        `
          query MultipleErrorsQuery {
            recipes {
              id
              title
            }
            errorQuery
            secondErrorQuery
          }
        `,
      );
      if (result.errors && result.errors.length > 0) {
        setError(JSON.stringify(result.errors));
      }
      if (result.data) {
        setResponse(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Client-Side GraphQL Testing:</strong> Buttons trigger
            GraphQL operations that always fail
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Broken GraphQL Mutations
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Client-side GraphQL operations that always fail
          </p>

          <div className="mt-8 space-y-4">
            <button
              onClick={handleErrorMutation}
              disabled={loading}
              className="w-full rounded-md bg-red-600 px-4 py-3 text-left font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-800"
            >
              <span className="block text-sm">Error Mutation</span>
              <span className="block text-xs opacity-75">
                mutation errorMutation (always throws)
              </span>
            </button>

            <button
              onClick={handleValidationMutation}
              disabled={loading}
              className="w-full rounded-md bg-orange-600 px-4 py-3 text-left font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-orange-700 dark:hover:bg-orange-800"
            >
              <span className="block text-sm">Validation Error Mutation</span>
              <span className="block text-xs opacity-75">
                mutation validationErrorMutation (validation fails)
              </span>
            </button>

            <button
              onClick={handleErrorQuery}
              disabled={loading}
              className="w-full rounded-md bg-purple-600 px-4 py-3 text-left font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-purple-700 dark:hover:bg-purple-800"
            >
              <span className="block text-sm">Error Query</span>
              <span className="block text-xs opacity-75">
                query errorQuery (always throws)
              </span>
            </button>

            <button
              onClick={handleSchemaValidationError}
              disabled={loading}
              className="w-full rounded-md bg-yellow-600 px-4 py-3 text-left font-medium text-white hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-yellow-700 dark:hover:bg-yellow-800"
            >
              <span className="block text-sm">Schema Validation Error</span>
              <span className="block text-xs opacity-75">
                unused variable (GraphQL validation fails)
              </span>
            </button>

            <button
              onClick={handleMultipleErrorsQuery}
              disabled={loading}
              className="w-full rounded-md bg-teal-600 px-4 py-3 text-left font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-teal-700 dark:hover:bg-teal-800"
            >
              <span className="block text-sm">Multiple Errors Query</span>
              <span className="block text-xs opacity-75">
                query with 1 success and 2 different errors
              </span>
            </button>
          </div>

          {loading && (
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <div className="flex items-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span className="ml-2 text-sm text-blue-800 dark:text-blue-200">
                  Loading...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <h3 className="font-medium text-red-900 dark:text-red-100">
                Error
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          {response !== null ? (
            <div className="mt-6 rounded-lg border border-zinc-300 bg-zinc-100 p-4 dark:border-zinc-600 dark:bg-zinc-700">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                Response
              </h3>
              <pre className="mt-2 overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          ) : null}

          <div className="mt-8 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
            <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">
              What this tests
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-purple-800 dark:text-purple-200">
              <li>Client-side GraphQL mutations and queries</li>
              <li>Error handling for GraphQL errors vs network errors</li>
              <li>Span creation from browser GraphQL operations</li>
              <li>End-to-end tracing from browser to GraphQL server</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
