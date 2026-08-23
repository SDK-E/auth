import { beforeEach, describe, expect, it, vi } from "vitest";
import { enforceRateLimit, requestClientIp, resetRateLimit } from "./rate-limit.ts";

const scope = `test-${Math.random().toString(36).slice(2)}`;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("enforceRateLimit", () => {
  it("counts within the window and blocks beyond the limit with retry-after", async () => {
    const key = `${scope}:burst`;
    const first = await enforceRateLimit("otp_request", key, 2, 60);
    expect(first).toMatchObject({ ok: true, count: 1 });
    expect(await enforceRateLimit("otp_request", key, 2, 60)).toMatchObject({ ok: true, count: 2 });

    const third = await enforceRateLimit("otp_request", key, 2, 60);
    expect(third.ok).toBe(false);
    if (!third.ok) {
      expect(third.retryAfterSec).toBeGreaterThanOrEqual(0);
      expect(third.retryAfterSec).toBeLessThanOrEqual(60);
      expect(third.count).toBe(3);
    }

    expect(await enforceRateLimit("otp_request", key, 1000, 60)).toMatchObject({ ok: true });
  });

  it("keys buckets independently per scope and key", async () => {
    await enforceRateLimit("verify_fail", `${scope}:shared`, 1, 60);
    expect(await enforceRateLimit("token", `${scope}:shared`, 1, 60)).toMatchObject({
      ok: true,
      count: 1,
    });
    expect((await enforceRateLimit("verify_fail", `${scope}:shared`, 1, 60)).ok).toBe(false);
  });

  it("resetRateLimit clears the bucket", async () => {
    const key = `${scope}:resettable`;
    await enforceRateLimit("login", key, 1, 60);
    expect((await enforceRateLimit("login", key, 1, 60)).ok).toBe(false);
    await resetRateLimit("login", key);
    expect(await enforceRateLimit("login", key, 1, 60)).toMatchObject({ ok: true, count: 1 });
  });

  it("fails open when no KV backend is configured", async () => {
    vi.resetModules();
    const savedUrl = process.env.KV_REST_API_URL;
    const savedToken = process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;

    try {
      const fresh = await import("./rate-limit.ts");
      expect(await fresh.enforceRateLimit("offline", "k", 1, 60)).toEqual({
        ok: true,
        count: 0,
      });
      await fresh.resetRateLimit("offline", "k");
    } finally {
      process.env.KV_REST_API_URL = savedUrl;
      process.env.KV_REST_API_TOKEN = savedToken;
      vi.resetModules();
    }
  });
});

describe("requestClientIp", () => {
  it("takes the first forwarded entry or reports unknown", () => {
    expect(
      requestClientIp(
        new Request("https://x/", { headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.2" } }),
      ),
    ).toBe("203.0.113.5");
    expect(requestClientIp(new Request("https://x/"))).toBe("unknown");
    expect(requestClientIp(new Request("https://x/", { headers: { "x-forwarded-for": "" } }))).toBe(
      "unknown",
    );
  });
});
