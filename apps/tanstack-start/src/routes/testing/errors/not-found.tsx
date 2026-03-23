import { createFileRoute } from "@tanstack/react-router";
import { getNotFoundRecipe } from "../../../server-fns/recipes";

export const Route = createFileRoute("/testing/errors/not-found")({
  // eslint-disable-next-line for-ai/no-bare-wrapper -- adapts OptionalFetcher to RouteLoaderFn
  loader: () => getNotFoundRecipe(),
  component: () => <div>This should never render</div>,
});
