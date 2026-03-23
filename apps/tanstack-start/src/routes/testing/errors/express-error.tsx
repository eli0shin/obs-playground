import { createFileRoute } from "@tanstack/react-router";
import { getExpressError } from "../../../server-fns/mutations";

export const Route = createFileRoute("/testing/errors/express-error")({
  // eslint-disable-next-line for-ai/no-bare-wrapper -- adapts OptionalFetcher to RouteLoaderFn
  loader: () => getExpressError(),
  component: () => <div>This should never render</div>,
});
