import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getDeferredError = createServerFn({ method: "GET" }).handler(async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  throw new Error("Deferred error after 2 second delay");
});

export const Route = createFileRoute("/testing/errors/suspense-error")({
  loader: () => getDeferredError(),
  component: () => <div>This should never render</div>,
});
