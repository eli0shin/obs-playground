import { createFileRoute } from "@tanstack/react-router";
import { getErrorQuery } from "../../../server-fns/recipes";

export const Route = createFileRoute("/testing/errors/graphql-error")({
  loader: () => getErrorQuery(),
  component: () => <div>This should never render</div>,
});
