import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { runtimeSchemaSql } from "./schema.js";

export interface RuntimeDatabaseOptions {
  databasePath?: string;
}

export interface RuntimeDatabaseHandle {
  database: DatabaseSync;
  databasePath: string;
}

export function getDefaultRuntimeDatabasePath() {
  return resolve(process.cwd(), "data", "clear402-runtime.sqlite");
}

export function initializeRuntimeDatabase(
  options: RuntimeDatabaseOptions = {}
): RuntimeDatabaseHandle {
  const databasePath = options.databasePath ?? getDefaultRuntimeDatabasePath();
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(runtimeSchemaSql);
  return { database, databasePath };
}
