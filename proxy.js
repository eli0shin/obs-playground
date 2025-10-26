import express from 'express';
import https from 'https';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PROXY_PORT ?? 443;

// Load SSL certificate
const httpsOptions = {
  key: fs.readFileSync('certs/key.pem'),
  cert: fs.readFileSync('certs/cert.pem'),
};

// GraphQL proxy - must come before /api to avoid conflicts
app.use('/graphql', createProxyMiddleware({
  target: 'http://localhost:4000',
  changeOrigin: true,
  logLevel: 'info',
}));

// Express API proxy
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  logLevel: 'info',
}));

// Next.js app proxy - catch all remaining routes
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  logLevel: 'info',
  ws: true, // Enable WebSocket support for Next.js HMR
}));

https.createServer(httpsOptions, app).listen(PORT, () => {
  const baseUrl = PORT === 443 ? 'https://localhost' : `https://localhost:${PORT}`;
  console.log(`
╭──────────────────────────────────────────╮
│  Proxy server running on port ${PORT}    │
│                                          │
│  Routes:                                 │
│  • ${baseUrl}          → Next.js    │
│  • ${baseUrl}/api      → Express    │
│  • ${baseUrl}/graphql  → GraphQL    │
╰──────────────────────────────────────────╯
  `);
});
