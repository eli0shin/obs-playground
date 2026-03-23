import { createFileRoute } from "@tanstack/react-router";
import { getNotFoundRecipe } from "../../../server-fns/recipes";

export const Route = createFileRoute("/testing/errors/not-found")({
  loader: getNotFoundRecipe,
  component: () => <div>This should never render</div>,
});
