"use client";

import Link from "next/link";
import { trpc } from "@/trpc/client";

export default function BrokenTrpcPage() {
  const internal = trpc.errors.internal.useMutation();
  const badRequest = trpc.errors.badRequest.useMutation();
  const notFound = trpc.errors.notFound.useMutation();

  const mutations = [
    {
      label: "Trigger 500",
      description: "INTERNAL_SERVER_ERROR thrown from tRPC procedure",
      mutation: internal,
    },
    {
      label: "Trigger 400",
      description: "BAD_REQUEST thrown from tRPC procedure",
      mutation: badRequest,
    },
    {
      label: "Trigger 404",
      description: "NOT_FOUND thrown from tRPC procedure",
      mutation: notFound,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Broken tRPC
        </h1>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          Vanilla tRPC mutations that fail with different HTTP status codes.
        </p>

        <div className="space-y-6">
          {mutations.map(({ label, description, mutation }) => {
            const error = mutation.error;
            return (
              <section
                key={label}
                className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {label}
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {description}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    mutation.reset();
                    mutation.mutate();
                  }}
                  disabled={mutation.isPending}
                  className="mt-4 rounded-md border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
                >
                  {mutation.isPending ? "Running..." : label}
                </button>

                {error ? (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    <div>
                      <span className="font-semibold">code:</span>{" "}
                      {error.data?.code ?? "UNKNOWN"}
                    </div>
                    <div>
                      <span className="font-semibold">httpStatus:</span>{" "}
                      {error.data?.httpStatus ?? "n/a"}
                    </div>
                    <div>
                      <span className="font-semibold">message:</span>{" "}
                      {error.message}
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
