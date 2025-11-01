import express from "express";
import https from "https";
import fs from "fs";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = 443;

// Load SSL certificate
const httpsOptions = {
  key: fs.readFileSync("certs/key.pem"),
  cert: fs.readFileSync("certs/cert.pem"),
};

// GraphQL proxy - must come before /api to avoid conflicts
app.use(
  "/graphql",
  createProxyMiddleware({
    target: "http://localhost:4000",
    changeOrigin: true,
    logLevel: "info",
    pathRewrite: {
      "^/": "/graphql",
    },
  }),
);

// Express API proxy
app.use(
  "/api",
  createProxyMiddleware({
    target: "http://localhost:3001",
    changeOrigin: true,
    logLevel: "info",
    pathRewrite: {
      "^/": "/api/",
    },
  }),
);

// Next.js app proxy - catch all remaining routes
app.use(
  "/",
  createProxyMiddleware({
    target: "http://localhost:3000",
    changeOrigin: true,
    logLevel: "info",
    ws: true, // Enable WebSocket support for Next.js HMR
  }),
);

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`
╭──────────────────────────────────────────╮
│  Proxy server running on port 443        │
│                                          │
│  Routes:                                 │
│  • https://localhost          → Next.js  │
│  • https://localhost/api      → Express  │
│  • https://localhost/graphql  → GraphQL  │
╰──────────────────────────────────────────╯
  `);
});
