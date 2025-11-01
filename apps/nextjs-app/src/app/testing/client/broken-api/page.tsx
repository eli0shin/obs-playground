"use client";

import { useState } from "react";
import Link from "next/link";

export default function BrokenAPIPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<Record<string, unknown> | null>(
    null,
  );

  const handleTestError = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/error/test");

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleNotFound = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/error/not-found");
      const data = await res.json();

      if (!res.ok) {
        setError(`HTTP ${res.status}: ${data.message || res.statusText}`);
      } else {
        setResponse(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleValidationError = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/error/validation");
      const data = await res.json();

      if (!res.ok) {
        setError(`HTTP ${res.status}: ${data.message || res.statusText}`);
        setResponse(data);
      } else {
        setResponse(data);
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
            <strong>Client-Side API Testing:</strong> Buttons trigger Express
            API calls that always fail
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Broken Express API Calls
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Client-side fetch calls to Express endpoints that always fail
          </p>

          <div className="mt-8 space-y-4">
            <button
              onClick={handleTestError}
              disabled={loading}
              className="w-full rounded-md bg-red-600 px-4 py-3 text-left font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-800"
            >
              <span className="block text-sm">Test 500 Error</span>
              <span className="block text-xs opacity-75">
                GET /api/error/test (throws exception)
              </span>
            </button>

            <button
              onClick={handleNotFound}
              disabled={loading}
              className="w-full rounded-md bg-orange-600 px-4 py-3 text-left font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-orange-700 dark:hover:bg-orange-800"
            >
              <span className="block text-sm">Test 404 Not Found</span>
              <span className="block text-xs opacity-75">
                GET /api/error/not-found (returns 404)
              </span>
            </button>

            <button
              onClick={handleValidationError}
              disabled={loading}
              className="w-full rounded-md bg-yellow-600 px-4 py-3 text-left font-medium text-white hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-yellow-700 dark:hover:bg-yellow-800"
            >
              <span className="block text-sm">Test 400 Validation Error</span>
              <span className="block text-xs opacity-75">
                GET /api/error/validation (returns 400)
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

          <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              What this tests
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-blue-800 dark:text-blue-200">
              <li>Client-side fetch calls to Express API</li>
              <li>Error handling for different HTTP status codes</li>
              <li>Span creation and error recording from browser</li>
              <li>End-to-end tracing from browser to backend</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
