FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Install only the Express workspace and the shared packages in its runtime graph.
COPY package.json package-lock.json ./
COPY patches ./patches
COPY apps/express-server/package.json ./apps/express-server/package.json
COPY packages/env/package.json ./packages/env/package.json
COPY packages/graphql-client/package.json ./packages/graphql-client/package.json
COPY packages/otel/package.json ./packages/otel/package.json

RUN npm ci

COPY apps/express-server ./apps/express-server
COPY packages/env ./packages/env
COPY packages/graphql-client ./packages/graphql-client
COPY packages/otel ./packages/otel

RUN npm run build --workspace=@obs-playground/env \
    && npm run build --workspace=@obs-playground/graphql-client \
    && npm run build --workspace=@obs-playground/otel \
    && npm run build --workspace=express-server \
    && npm prune --omit=dev --ignore-scripts

FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001 \
    SQLITE_PATH=/var/data/app.db

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/express-server/package.json ./apps/express-server/package.json
COPY --from=builder --chown=node:node /app/apps/express-server/dist ./apps/express-server/dist
COPY --from=builder --chown=node:node /app/apps/express-server/drizzle ./apps/express-server/drizzle
COPY --from=builder --chown=node:node /app/packages/env/package.json ./packages/env/package.json
COPY --from=builder --chown=node:node /app/packages/env/dist ./packages/env/dist
COPY --from=builder --chown=node:node /app/packages/graphql-client/package.json ./packages/graphql-client/package.json
COPY --from=builder --chown=node:node /app/packages/graphql-client/dist ./packages/graphql-client/dist
COPY --from=builder --chown=node:node /app/packages/otel/package.json ./packages/otel/package.json
COPY --from=builder --chown=node:node /app/packages/otel/dist ./packages/otel/dist

RUN mkdir -p /var/data

EXPOSE 3001

CMD ["node", "apps/express-server/dist/index.js"]
