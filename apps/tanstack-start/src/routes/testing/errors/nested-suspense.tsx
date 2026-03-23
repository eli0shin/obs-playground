import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { graphqlRequest } from "@obs-playground/graphql-client";

const getNestedData = createServerFn({ method: "GET" }).handler(async () => {
  // Outer data succeeds after 1s
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const recipeResult = await graphqlRequest<{
    recipe: { id: string; title: string } | null;
  }>(`query { recipe(id: "1") { id title } }`);

  // Inner data errors after 1.5s
  await new Promise((resolve) => setTimeout(resolve, 500));
  throw new Error("Nested deferred error: inner data failed after 1.5s total");

  return recipeResult; // unreachable
});

export const Route = createFileRoute("/testing/errors/nested-suspense")({
  loader: () => getNestedData(),
  component: () => <div>This should never render</div>,
});
