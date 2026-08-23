import { afterAll } from "vitest";
import type { Db } from "../../../packages/db/src/client.ts";
import { initTestDb } from "./support/test-db.ts";
import { startFakeUpstash } from "./support/upstash-fake.ts";

const fakeKv = await startFakeUpstash("m3-vitest-kv-token");

const env = process.env as Record<string, string | undefined>;
env.NODE_ENV = "test";
env.DATABASE_URL = env.DATABASE_URL ?? "postgres://vitest.invalid/platform";
env.AUTH_ENCRYPTION_KEY = "m3-vitest-envelope-key-0123456789abcdef";
env.KV_REST_API_URL = fakeKv.url;
env.KV_REST_API_TOKEN = "m3-vitest-kv-token";

globalThis.__sdkEAuthTestDb = (await initTestDb()) as unknown as Db;

afterAll(async () => {
  await fakeKv.close();
});
