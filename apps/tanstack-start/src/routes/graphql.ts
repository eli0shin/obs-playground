import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/graphql")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const baseUrl = process.env.GRAPHQL_BASE_URL?.replace(/\/+$/, "");
        if (!baseUrl) {
          return new Response("GRAPHQL_BASE_URL is not configured", {
            status: 500,
          });
        }

        const upstream = await fetch(`${baseUrl}/graphql`, {
          method: "POST",
          headers: {
            "content-type":
              request.headers.get("content-type") ?? "application/json",
          },
          body: await request.text(),
        });

        return new Response(upstream.body, {
          status: upstream.status,
          headers: upstream.headers,
        });
      },
    },
  },
});
