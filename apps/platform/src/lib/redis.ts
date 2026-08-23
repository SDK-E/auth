import { Redis } from "@upstash/redis";
import { tryKvEnv } from "@sdk-e/shared";

let client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (client === undefined) {
    const env = tryKvEnv();
    client = env
      ? new Redis({ url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN })
      : null;
  }
  return client;
}

export type KvHealth =
  | { status: "ok"; latencyMs: number }
  | { status: "not_configured" }
  | { status: "error"; error: string };

export async function kvHealthCheck(): Promise<KvHealth> {
  const redis = getRedis();
  if (!redis) return { status: "not_configured" };
  try {
    const start = performance.now();
    const pong = await redis.ping();
    if (pong !== "PONG") return { status: "error", error: `unexpected ping reply: ${String(pong)}` };
    return { status: "ok", latencyMs: Math.round(performance.now() - start) };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "unknown kv error",
    };
  }
}
