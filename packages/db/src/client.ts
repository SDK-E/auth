import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.ts";

let client: postgres.Sql | undefined;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to access the database");
  }
  client ??= postgres(url, { prepare: false });
  return drizzle(client, { schema, casing: "snake_case" });
}

export type Db = ReturnType<typeof getDb>;
export type DbTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
export { schema };

export async function dbHealthCheck(): Promise<{
  ok: boolean;
  latencyMs?: number;
  error?: string;
}> {
  try {
    const start = performance.now();
    await getDb().execute(sql`select 1`);
    return { ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "unknown error",
    };
  }
}
