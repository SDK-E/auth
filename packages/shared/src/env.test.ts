import { beforeEach, describe, expect, it, vi } from "vitest";

const SAVED_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...SAVED_ENV };
  delete process.env.DATABASE_URL;
  delete process.env.AUTH_BASE_DOMAIN;
  delete process.env.AUTH_ENCRYPTION_KEY;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.MAIL_SMTP_URL;
  delete process.env.MAIL_FROM;
  delete process.env.RESEND_API_KEY;
  vi.resetModules();
});

describe("serverEnvSchema", () => {
  it("requires DATABASE_URL", async () => {
    const { serverEnvSchema } = await import("./env.ts");
    const result = serverEnvSchema.safeParse({ NODE_ENV: "test" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("DATABASE_URL");
    }
  });

  it("applies defaults for optional values", async () => {
    const { serverEnvSchema } = await import("./env.ts");
    const result = serverEnvSchema.parse({
      NODE_ENV: "test",
      DATABASE_URL: "postgres://db.invalid/x",
    });
    expect(result.AUTH_BASE_DOMAIN).toBe("auth.sdk.enterprises");
    expect(result.AUTH_ENCRYPTION_KEY.length).toBeGreaterThanOrEqual(16);
  });

  it("rejects a too-short encryption key", async () => {
    const { serverEnvSchema } = await import("./env.ts");
    expect(
      serverEnvSchema.safeParse({
        DATABASE_URL: "postgres://db.invalid/x",
        AUTH_ENCRYPTION_KEY: "short",
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown NODE_ENV value", async () => {
    const { serverEnvSchema } = await import("./env.ts");
    expect(
      serverEnvSchema.safeParse({
        NODE_ENV: "staging",
        DATABASE_URL: "postgres://db.invalid/x",
      }).success,
    ).toBe(false);
  });
});

describe("serverEnv", () => {
  it("caches the parsed environment across calls", async () => {
    process.env.DATABASE_URL = "postgres://first.invalid/one";
    const envModule = await import("./env.ts");
    const first = envModule.serverEnv();
    process.env.DATABASE_URL = "postgres://second.invalid/two";
    const second = envModule.serverEnv();
    expect(second).toBe(first);
    expect(second.DATABASE_URL).toBe("postgres://first.invalid/one");
  });

  it("tryServerEnv reports zod errors instead of throwing", async () => {
    const envModule = await import("./env.ts");
    const result = envModule.tryServerEnv();
    expect("error" in result && Array.isArray(result.error.issues)).toBe(true);
  });

  it("tryServerEnv returns the env when valid", async () => {
    process.env.DATABASE_URL = "postgres://ok.invalid/db";
    const envModule = await import("./env.ts");
    const result = envModule.tryServerEnv();
    expect("DATABASE_URL" in result && result.DATABASE_URL).toBe("postgres://ok.invalid/db");
  });
});

describe("mailEnvSchema", () => {
  it("defaults to the local SMTP sink and verified sender", async () => {
    const { mailEnvSchema } = await import("./env.ts");
    const mail = mailEnvSchema.parse({});
    expect(mail.MAIL_SMTP_URL).toBe("smtp://localhost:1025");
    expect(mail.MAIL_FROM).toContain("no-reply@mx.sdk.enterprises");
    expect(mail.RESEND_API_KEY).toBeUndefined();
  });

  it("accepts a Resend key override", async () => {
    const { mailEnvSchema } = await import("./env.ts");
    const mail = mailEnvSchema.parse({ RESEND_API_KEY: "re_test_key" });
    expect(mail.RESEND_API_KEY).toBe("re_test_key");
  });
});

describe("kvEnvSchema / tryKvEnv", () => {
  it("returns undefined when KV vars are unset or invalid", async () => {
    const envModule = await import("./env.ts");
    expect(envModule.tryKvEnv()).toBeUndefined();
    process.env.KV_REST_API_URL = "not-a-url";
    expect(envModule.tryKvEnv()).toBeUndefined();
    process.env.KV_REST_API_URL = "http://127.0.0.1:8000";
    delete process.env.KV_REST_API_TOKEN;
    expect(envModule.tryKvEnv()).toBeUndefined();
  });

  it("parses a complete local pair", async () => {
    process.env.KV_REST_API_URL = "http://127.0.0.1:8000";
    process.env.KV_REST_API_TOKEN = "upstash";
    const envModule = await import("./env.ts");
    expect(envModule.tryKvEnv()).toEqual({
      KV_REST_API_URL: "http://127.0.0.1:8000",
      KV_REST_API_TOKEN: "upstash",
    });
  });
});
