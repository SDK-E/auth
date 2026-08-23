import { afterEach, describe, expect, it, vi } from "vitest";

const SAVED = {
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
};

afterEach(() => {
  process.env.KV_REST_API_URL = SAVED.url;
  process.env.KV_REST_API_TOKEN = SAVED.token;
  vi.resetModules();
  vi.restoreAllMocks();
});

async function freshRedis() {
  vi.resetModules();
  return import("@/lib/redis");
}

describe("getRedis", () => {
  it("returns null when KV is not configured", async () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    const redisModule = await freshRedis();
    expect(redisModule.getRedis()).toBeNull();
  });

  it("caches a single client per module lifetime", async () => {
    const redisModule = await freshRedis();
    const first = redisModule.getRedis();
    expect(first).not.toBeNull();
    expect(redisModule.getRedis()).toBe(first);
  });
});

describe("kvHealthCheck", () => {
  it("reports not_configured without env", async () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    const redisModule = await freshRedis();
    expect(await redisModule.kvHealthCheck()).toEqual({ status: "not_configured" });
  });

  it("reports ok against a live endpoint", async () => {
    const redisModule = await freshRedis();
    const health = await redisModule.kvHealthCheck();
    expect(health.status).toBe("ok");
    if (health.status === "ok") {
      expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("reports error when the endpoint refuses connections", async () => {
    process.env.KV_REST_API_URL = "http://127.0.0.1:1";
    process.env.KV_REST_API_TOKEN = "x";
    const redisModule = await freshRedis();
    const health = await redisModule.kvHealthCheck();
    expect(health.status).toBe("error");
  });
});
