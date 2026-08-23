import type { Db } from "../../../../packages/db/src/client.ts";

export * from "../../../../packages/db/src/index.ts";

declare global {
  var __sdkEAuthTestDb: Db | undefined;
}

export function getDb(): Db {
  const db = globalThis.__sdkEAuthTestDb;
  if (!db) throw new Error("test database not initialized; setup.ts must run first");
  return db;
}
