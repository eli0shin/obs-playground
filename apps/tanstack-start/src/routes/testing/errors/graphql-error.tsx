import { createFileRoute } from "@tanstack/react-router";
import { getErrorQuery } from "../../../server-fns/recipes";

export const Route = createFileRoute("/testing/errors/graphql-error")({
  // eslint-disable-next-line for-ai/no-bare-wrapper -- adapts OptionalFetcher to RouteLoaderFn
  loader: () => getErrorQuery(),
  component: () => <div>This should never render</div>,
});
