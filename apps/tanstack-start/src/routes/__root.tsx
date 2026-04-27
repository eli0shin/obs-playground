import {
  HeadContent,
  Scripts,
  createRootRoute,
  useRouteContext,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRuntimeEnv } from "@obs-playground/env";

import "../styles.css";

const fetchRuntimeEnv = createServerFn({ method: "GET" }).handler(getRuntimeEnv);

export const Route = createRootRoute({
  beforeLoad: async () => ({ runtimeEnv: await fetchRuntimeEnv() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TanStack Start - OTEL Playground" },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { runtimeEnv } = useRouteContext({ from: "__root__" });

  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          // eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml -- runtime env injection requires raw script content
          dangerouslySetInnerHTML={{
            __html: `window.__ENV=${JSON.stringify(runtimeEnv)}`,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
