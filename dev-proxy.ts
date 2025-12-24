import express, { Application } from "express";
import https from "https";
import fs from "fs";
import { createProxyMiddleware } from "http-proxy-middleware";

// Configurable ports via environment variables (for CI where port 443 requires sudo)
const PROXY_PORT = parseInt(process.env.PROXY_PORT || "443", 10);
const PROXY_PORT_CUSTOM = parseInt(process.env.PROXY_PORT_CUSTOM || "8443", 10);

// Load SSL certificate
const httpsOptions = {
  key: fs.readFileSync("certs/key.pem"),
  cert: fs.readFileSync("certs/cert.pem"),
};

// Shared middleware for API and GraphQL routes
function setupSharedRoutes(app: Application): void {
  // GraphQL proxy - must come before /api to avoid conflicts
  app.use(
    "/graphql",
    createProxyMiddleware({
      target: "http://localhost:4000",
      changeOrigin: true,
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
      pathRewrite: {
        "^/": "/api/",
      },
    }),
  );
}

// Normal mode proxy (port 443 → Next.js port 3000)
const normalApp = express();
setupSharedRoutes(normalApp);
normalApp.use(
  "/",
  createProxyMiddleware({
    target: "http://localhost:3000",
    changeOrigin: true,
    ws: true,
  }),
);

// Custom mode proxy (port 8443 → Next.js port 3002)
const customApp = express();
setupSharedRoutes(customApp);
customApp.use(
  "/",
  createProxyMiddleware({
    target: "http://localhost:3002",
    changeOrigin: true,
    ws: true,
  }),
);

const normalUrl =
  PROXY_PORT === 443 ? "https://localhost" : `https://localhost:${PROXY_PORT}`;
const customUrl = `https://localhost:${PROXY_PORT_CUSTOM}`;

https.createServer(httpsOptions, normalApp).listen(PROXY_PORT, () => {
  console.log(`
╭───────────────────────────────────────────────────────────────╮
│  Proxy servers running                                        │
│                                                               │
│  Normal mode (port ${PROXY_PORT}):${" ".repeat(Math.max(0, 39 - PROXY_PORT.toString().length))}│
│  • ${normalUrl.padEnd(24)} → Next.js (built-in server)     │
│  • ${(normalUrl + "/api").padEnd(24)} → Express                       │
│  • ${(normalUrl + "/graphql").padEnd(24)} → GraphQL                       │
│                                                               │
│  Custom mode (port ${PROXY_PORT_CUSTOM}):${" ".repeat(Math.max(0, 37 - PROXY_PORT_CUSTOM.toString().length))}│
│  • ${customUrl.padEnd(24)} → Next.js (custom server)  │
│  • ${(customUrl + "/api").padEnd(24)} → Express                  │
│  • ${(customUrl + "/graphql").padEnd(24)} → GraphQL                  │
╰───────────────────────────────────────────────────────────────╯
  `);
});

https.createServer(httpsOptions, customApp).listen(PROXY_PORT_CUSTOM);
