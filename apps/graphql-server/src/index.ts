import { logger } from "./otel.js";
import { ApolloServer } from "@apollo/server";
import type { ApolloServerPlugin } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import cors from "cors";
import { typeDefs } from "./schema/index.js";
import { resolvers } from "./resolvers/index.js";

const loggingPlugin = {
  async requestDidStart({ request }) {
    const operationName = request.operationName ?? "anonymous";
    logger.info("GraphQL operation started", { operationName });

    return {
      async didEncounterErrors({ errors }) {
        for (const err of errors) {
          logger.error("GraphQL error", {
            operationName,
            err,
            path: err.path,
            code: err.extensions.code,
          });
        }
      },
      async willSendResponse({ response }) {
        const errorCount =
          response.body.kind === "single"
            ? (response.body.singleResult.errors?.length ?? 0)
            : 0;
        logger.info("GraphQL operation completed", {
          operationName,
          errorCount,
        });
      },
    };
  },
} satisfies ApolloServerPlugin;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [loggingPlugin],
});

await server.start();

const app = express();
const PORT = +(process.env.PORT || "4000");

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
    };

    if (res.statusCode >= 500) {
      logger.error("GraphQL HTTP request failed", log);
    } else if (res.statusCode >= 400) {
      logger.warn("GraphQL HTTP request client error", log);
    } else {
      logger.info("GraphQL HTTP request completed", log);
    }
  });

  next();
});

app.post("/graphql", cors(), express.json(), expressMiddleware(server));

app.listen(PORT, () => {
  logger.info("GraphQL server listening", { port: PORT });
});
