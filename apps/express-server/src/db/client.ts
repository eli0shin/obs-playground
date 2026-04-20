import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/node-sqlite";
import * as schema from "./schema";

function getDbPath(): string {
  const raw = process.env.SQLITE_PATH ?? "./data/app.db";
  return resolve(raw);
}

function openSqlite(dbPath: string): DatabaseSync {
  mkdirSync(dirname(dbPath), { recursive: true });
  const sqlite = new DatabaseSync(dbPath);
  sqlite.exec("PRAGMA foreign_keys = ON");
  sqlite.exec("PRAGMA journal_mode = WAL");
  return sqlite;
}

export const dbPath = getDbPath();
export const sqlite = openSqlite(dbPath);
export const db = drizzle({ client: sqlite, schema });
