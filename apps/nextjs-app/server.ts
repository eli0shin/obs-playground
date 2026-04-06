import { logger } from "./src/otel";
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

  server.listen(port, () => {
    logger.info("Next.js custom server ready", { hostname, port });
  });
});
