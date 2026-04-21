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
    const variableCount = request.variables
      ? Object.keys(request.variables).length
      : 0;
    logger.info("GraphQL operation started", {
      "graphql.operation_name": operationName,
      "graphql.variable_count": variableCount,
    });

    let operationType: string | undefined;

    return {
      async didResolveOperation({ operation }) {
        operationType = operation?.operation;
      },
      async didEncounterErrors({ errors }) {
        for (const err of errors) {
          logger.error("GraphQL error", {
            "graphql.operation_name": operationName,
            "graphql.operation_type": operationType,
            err,
            "graphql.error.path": err.path,
            "graphql.error.code": err.extensions.code,
          });
        }
      },
      async willSendResponse({ response }) {
        const errorCount =
          response.body.kind === "single"
            ? (response.body.singleResult.errors?.length ?? 0)
            : 0;
        logger.info("GraphQL operation completed", {
          "graphql.operation_name": operationName,
          "graphql.operation_type": operationType,
          "graphql.error_count": errorCount,
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
const HOST = "0.0.0.0";

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const contentLength = res.getHeader("content-length");
    const log = {
      "http.method": req.method,
      "http.path": req.path,
      "http.status_code": res.statusCode,
      "http.duration_ms": durationMs,
      "http.user_agent": req.get("user-agent"),
      "http.response_content_length":
        typeof contentLength === "string"
          ? parseInt(contentLength, 10)
          : undefined,
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

app.listen(PORT, HOST, () => {
  logger.info("GraphQL server listening", { port: PORT });
});
