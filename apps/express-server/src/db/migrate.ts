import { resolve } from "node:path";
import { migrate } from "drizzle-orm/node-sqlite/migrator";
import { db, dbPath } from "./client";
import { logger } from "../otel";

/**
 * Migrations folder lives at apps/express-server/drizzle/.
 * This file is at src/db/migrate.ts in dev and dist/db/migrate.js in prod,
 * so `../../drizzle` resolves correctly in both cases.
 */
const migrationsFolder = resolve(__dirname, "..", "..", "drizzle");

export function runMigrations(): void {
  logger.info("Running database migrations", { migrationsFolder, dbPath });
  migrate(db, { migrationsFolder });
  logger.info("Database migrations complete");
}
