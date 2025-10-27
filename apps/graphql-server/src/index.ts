import "./otel.js";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import cors from "cors";
import { typeDefs } from "./schema/index.js";
import { resolvers } from "./resolvers/index.js";
import { errorTrackingPlugin } from "./plugins/error-tracking.js";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [errorTrackingPlugin],
});

await server.start();

const app = express();
const PORT = +(process.env.PORT || "4000");

app.post("/graphql", cors(), express.json(), expressMiddleware(server));

app.listen(PORT);
