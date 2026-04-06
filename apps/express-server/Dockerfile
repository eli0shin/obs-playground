ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY patches ./patches
COPY apps/express-server/package.json apps/express-server/package.json
COPY packages/env/package.json packages/env/package.json
COPY packages/graphql-client/package.json packages/graphql-client/package.json
COPY packages/otel/package.json packages/otel/package.json
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build --workspace=@obs-playground/env \
  && npm run build --workspace=@obs-playground/graphql-client \
  && npm run build --workspace=@obs-playground/otel \
  && npm run build --workspace=express-server \
  && npm prune --omit=dev

FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/package-lock.json /app/turbo.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/express-server ./apps/express-server
COPY --from=builder /app/packages/env ./packages/env
COPY --from=builder /app/packages/graphql-client ./packages/graphql-client
COPY --from=builder /app/packages/otel ./packages/otel
EXPOSE 3001
CMD ["node", "apps/express-server/dist/index.js"]
