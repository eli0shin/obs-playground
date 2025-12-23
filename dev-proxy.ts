import express, { Application } from "express";
import https from "https";
import fs from "fs";
import { createProxyMiddleware } from "http-proxy-middleware";

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

https.createServer(httpsOptions, normalApp).listen(443, () => {
  console.log(`
╭───────────────────────────────────────────────────────────────╮
│  Proxy servers running                                        │
│                                                               │
│  Normal mode (port 443):                                      │
│  • https://localhost          → Next.js (built-in server)     │
│  • https://localhost/api      → Express                       │
│  • https://localhost/graphql  → GraphQL                       │
│                                                               │
│  Custom mode (port 8443):                                     │
│  • https://localhost:8443          → Next.js (custom server)  │
│  • https://localhost:8443/api      → Express                  │
│  • https://localhost:8443/graphql  → GraphQL                  │
╰───────────────────────────────────────────────────────────────╯
  `);
});

https.createServer(httpsOptions, customApp).listen(8443);
