import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/testing/errors/500")({
  loader: () => {
    throw new Error("Intentional 500 error during page render");
  },
  component: () => <div>This should never render</div>,
});
