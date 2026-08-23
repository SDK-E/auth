import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const migrationsFolder = fileURLToPath(
  new URL("../../../../packages/db/drizzle", import.meta.url),
);

export async function initTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { casing: "snake_case" });
  await migrate(db, { migrationsFolder });
  return db;
}
