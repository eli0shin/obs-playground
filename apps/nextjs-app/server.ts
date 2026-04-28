import "./src/otel";
import { logger } from "./src/logger";
import express from "express";
import next from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();
const server = express();

app.prepare().then(() => {
  server.use((req, res) => {
    return handle(req, res);
  });

  server.listen(port, (error) => {
    if (!error) {
      logger.info("Next.js custom server ready", { hostname, port });
      console.log(`Next.js custom server ready at ${hostname}:${port}`);
    } else {
      logger.error("next custom server failed to start", { error });
      console.error(error);
    }
  });
});
