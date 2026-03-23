import { createFileRoute } from "@tanstack/react-router";
import { getExpressError } from "../../../server-fns/mutations";

export const Route = createFileRoute("/testing/errors/express-error")({
  loader: getExpressError,
  component: () => <div>This should never render</div>,
});
