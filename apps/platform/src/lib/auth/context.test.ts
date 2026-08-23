import { HEADER_HOST_KIND, HEADER_TENANT_SLUG } from "@sdk-e/shared";
import { afterEach, describe, expect, it } from "vitest";
import { getDb } from "@sdk-e/db";
import {
  AuthError,
  issuerFromRequest,
  resolveAuthContext,
  resolveEnvironmentKey,
  resolveTenantEnvironment,
} from "./context.ts";
import { seedCustomDomain, seedTenantEnvironment } from "../../../tests/support/seed.ts";

const SAVED_VERCEL_ENV = process.env.VERCEL_ENV;
const SAVED_NODE_ENV = process.env.NODE_ENV;

afterEach(() => {
  const env = process.env as Record<string, string | undefined>;
  env.VERCEL_ENV = SAVED_VERCEL_ENV;
  env.NODE_ENV = SAVED_NODE_ENV;
});

describe("issuerFromRequest", () => {
  it("prefers the first forwarded proto", () => {
    const request = new Request("https://acme.auth.test/authorize", {
      headers: { "x-forwarded-proto": "https, http" },
    });
    expect(issuerFromRequest(request)).toBe("https://acme.auth.test");
  });

  it("falls back to http only for localhost", () => {
    expect(issuerFromRequest(new Request("http://localhost:3000/u/login"))).toBe(
      "http://localhost:3000",
    );
    expect(issuerFromRequest(new Request("http://127.0.0.1:3000/x"))).toBe("http://127.0.0.1:3000");
    expect(issuerFromRequest(new Request("https://auth.sdk.enterprises/"))).toBe(
      "https://auth.sdk.enterprises",
    );
  });
});

describe("resolveEnvironmentKey", () => {
  it("maps host kinds and vercel env deterministically", () => {
    const env = process.env as Record<string, string | undefined>;
    delete env.VERCEL_ENV;
    env.NODE_ENV = "test";
    expect(resolveEnvironmentKey("local")).toBe("development");

    env.VERCEL_ENV = "production";
    expect(resolveEnvironmentKey("base")).toBe("production");
    expect(resolveEnvironmentKey("tenant")).toBe("production");

    env.VERCEL_ENV = "preview";
    expect(resolveEnvironmentKey("base")).toBe("staging");
    expect(resolveEnvironmentKey("custom")).toBe("staging");

    delete env.VERCEL_ENV;
    expect(resolveEnvironmentKey("base")).toBe("development");

    env.NODE_ENV = "production";
    expect(resolveEnvironmentKey("base")).toBe("production");
  });
});

describe("resolveTenantEnvironment", () => {
  it("resolves by slug and environment key", async () => {
    const db = getDb();
    const seeded = await seedTenantEnvironment(db, { slug: "resolver-acme" });
    const result = await resolveTenantEnvironment("resolver-acme", "development");
    expect(result.tenant.id).toBe(seeded.tenant.id);
    expect(result.environment.id).toBe(seeded.environment.id);
  });

  it("falls back to the default environment when the requested key is absent", async () => {
    const db = getDb();
    await seedTenantEnvironment(db, { slug: "fallback-acme" });
    const resolved = await resolveTenantEnvironment("fallback-acme", "production");
    expect(resolved.environment.isDefault).toBe(true);
  });

  it("raises typed errors for unknown tenants and empty environments", async () => {
    await expect(resolveTenantEnvironment("ghost_tenant", "development")).rejects.toMatchObject({
      code: "unknown_tenant",
    });

    const db = getDb();
    await seedPlanOnly();
    await db.insert((await import("@sdk-e/db")).tenants).values({
      name: "Empty",
      slug: "envless_tenant",
      planKey: "m3-test-free",
    });
    await expect(resolveTenantEnvironment("envless_tenant", "development")).rejects.toMatchObject({
      code: "unknown_environment",
    });
  });
});

describe("resolveAuthContext", () => {
  it("resolves tenant context from proxy headers", async () => {
    const db = getDb();
    const seeded = await seedTenantEnvironment(db, { slug: "header-acme" });
    const request = new Request("https://header-acme.auth.test/authorize", {
      headers: {
        [HEADER_HOST_KIND]: "tenant",
        [HEADER_TENANT_SLUG]: "header-acme",
      },
    });
    const ctx = await resolveAuthContext(request);
    expect(ctx.tenant.id).toBe(seeded.tenant.id);
    expect(ctx.environment.id).toBe(seeded.environment.id);
    expect(ctx.hostKind).toBe("tenant");
    expect(ctx.issuer).toBe("https://header-acme.auth.test");
  });

  it("defaults to the platform tenant when no headers exist", async () => {
    await seedTenantEnvironment(getDb(), { slug: "sdk-e" });
    const request = new Request("http://localhost:3000/dashboard", {
      headers: { [HEADER_HOST_KIND]: "local" },
    });
    const ctx = await resolveAuthContext(request);
    expect(ctx.hostKind).toBe("local");
    expect(ctx.tenant.slug).toBe("sdk-e");
    expect(ctx.environment.key).toBe("development");
  });

  it("maps custom domains through the domains table", async () => {
    const db = getDb();
    const seeded = await seedTenantEnvironment(db, { slug: "domain-acme" });
    await seedCustomDomain(db, {
      tenantId: seeded.tenant.id,
      environmentId: seeded.environment.id,
      domain: "login.domain-acme.test",
    });

    const request = new Request("https://login.domain-acme.test/oauth/token", {
      headers: { [HEADER_HOST_KIND]: "custom" },
    });
    const ctx = await resolveAuthContext(request);
    expect(ctx.tenant.slug).toBe("domain-acme");
    expect(ctx.hostKind).toBe("custom");
    expect(ctx.issuer).toBe("https://login.domain-acme.test");
  });

  it("rejects unknown custom domains with a typed error", async () => {
    const request = new Request("https://stray.example/oauth/token", {
      headers: { [HEADER_HOST_KIND]: "custom" },
    });
    await expect(resolveAuthContext(request)).rejects.toBeInstanceOf(AuthError);
    await expect(resolveAuthContext(request)).rejects.toMatchObject({ code: "unknown_domain" });
  });
});

async function seedPlanOnly(): Promise<void> {
  const { plans } = await import("@sdk-e/db");
  await getDb().insert(plans).values({ key: "m3-test-free", name: "x" }).onConflictDoNothing();
}
