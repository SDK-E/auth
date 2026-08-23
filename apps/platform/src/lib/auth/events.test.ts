import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { authEvents, getDb } from "@sdk-e/db";
import { recordAuthEvent } from "./events.ts";
import { authContextFor, seedTenantEnvironment } from "../../../tests/support/seed.ts";

describe("recordAuthEvent", () => {
  it("persists an event scoped to tenant and environment", async () => {
    const db = getDb();
    const seeded = await seedTenantEnvironment(db);
    const ctx = authContextFor(seeded.tenant, seeded.environment);

    await recordAuthEvent({
      ctx,
      userId: null,
      eventType: "login_success",
      result: "success",
      ip: "192.0.2.9",
      userAgent: "vitest",
      details: { method: "email_otp" },
    });

    const rows = await db
      .select()
      .from(authEvents)
      .where(eq(authEvents.environmentId, seeded.environment.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.eventType).toBe("login_success");
    expect(rows[0]?.result).toBe("success");
    expect(rows[0]?.tenantId).toBe(seeded.tenant.id);
  });

  it("never throws when persistence fails", async () => {
    const db = getDb();
    const seeded = await seedTenantEnvironment(db);
    const brokenCtx = {
      ...authContextFor(seeded.tenant, seeded.environment),
      tenant: { ...seeded.tenant, id: "tenant_missing" },
      environment: { ...seeded.environment, id: "env_missing" },
    };
    await expect(
      recordAuthEvent({
        ctx: brokenCtx,
        eventType: "login_failure",
        result: "failure",
        failureReason: "otp_mismatch",
      }),
    ).resolves.toBeUndefined();
  });
});
