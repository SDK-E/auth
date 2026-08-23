import { asc, eq } from "drizzle-orm";
import { sha256Hex } from "@sdk-e/engine";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auditLogs, getDb } from "@sdk-e/db";
import {
  auditContextForEnvironment,
  canonicalJson,
  computeAuditChainHead,
  computeAuditEntryHash,
  recordAudit,
} from "./audit.ts";
import { seedTenantEnvironment } from "../../../tests/support/seed.ts";

let environmentId: string;
let tenantId: string;

beforeEach(async () => {
  const seeded = await seedTenantEnvironment(getDb());
  environmentId = seeded.environment.id;
  tenantId = seeded.tenant.id;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("canonicalJson", () => {
  it("serializes primitives deterministically", () => {
    expect(canonicalJson(null)).toBe("null");
    expect(canonicalJson(42)).toBe("42");
    expect(canonicalJson(true)).toBe("true");
    expect(canonicalJson("hi")).toBe('"hi"');
  });

  it("sorts object keys at every level", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalJson({ z: { y: 1, x: [2, { c: 3, b: 4 }] }, a: 5 })).toBe(
      '{"a":5,"z":{"x":[2,{"b":4,"c":3}],"y":1}}',
    );
  });

  it("drops undefined values and preserves array order", () => {
    expect(canonicalJson({ keep: 1, drop: undefined })).toBe('{"keep":1}');
    expect(canonicalJson([2, 1])).toBe("[2,1]");
    expect(canonicalJson({})).toBe("{}");
  });
});

describe("computeAuditEntryHash", () => {
  it("binds the previous hash to a stable serialization", () => {
    const fields = { actionType: "login_success", actorId: "usr_1" };
    const expected = sha256Hex(`0${JSON.stringify(fields)}`);
    expect(computeAuditEntryHash("0", fields)).toBe(expected);
    expect(computeAuditEntryHash("abc", fields)).not.toBe(computeAuditEntryHash("abd", fields));
  });
});

describe("recordAudit chain", () => {
  it("chains entries per environment from genesis", async () => {
    expect(await computeAuditChainHead(environmentId)).toBe("0");

    await recordAudit({
      ctx: { tenant: { id: tenantId }, environment: { id: environmentId } },
      actorType: "user",
      actorId: "usr_chain",
      actionType: "login_success",
      targetType: "session",
      targetId: "ses_1",
      payload: { method: "email_otp" },
      ip: "198.51.100.1",
      userAgent: "vitest",
    });
    await recordAudit({
      ctx: { tenant: { id: tenantId }, environment: { id: environmentId } },
      actorType: "client",
      actorId: "client_x",
      actionType: "token_issued",
      payload: {},
    });
    await recordAudit({
      ctx: { tenant: { id: tenantId }, environment: { id: environmentId } },
      actorType: "system",
      actorId: "signing_keys",
      actionType: "signing_key_created",
      payload: { algorithm: "RS256" },
    });

    const rows = await getDb()
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.environmentId, environmentId))
      .orderBy(asc(auditLogs.seq));

    expect(rows).toHaveLength(3);
    expect(rows[0]?.previousHash).toBe("0");
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i]!;
      const previous = row.previousHash ?? "0";
      if (i > 0) expect(previous).toBe(rows[i - 1]?.entryHash);

      const recomputed = computeAuditEntryHash(previous, {
        tenantId: row.tenantId,
        environmentId: row.environmentId,
        actorType: row.actorType,
        actorId: row.actorId,
        actionType: row.actionType,
        targetType: row.targetType,
        targetId: row.targetId,
        payload: row.payload,
        ip: row.ip,
        userAgent: row.userAgent,
        occurredAt: row.occurredAt.toISOString(),
      });
      expect(recomputed).toBe(row.entryHash);
    }

    expect(await computeAuditChainHead(environmentId)).toBe(rows[2]?.entryHash);
  });

  it("keeps chains isolated between environments", async () => {
    const other = await seedTenantEnvironment(getDb());
    await recordAudit({
      ctx: { tenant: { id: tenantId }, environment: { id: environmentId } },
      actorType: "user",
      actorId: "usr_a",
      actionType: "login_success",
    });
    const headOther = await computeAuditChainHead(other.environment.id);
    expect(headOther).toBe("0");
  });

  it("swallows persistence failures instead of breaking auth flows", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await recordAudit({
      ctx: { tenant: { id: "tenant_missing" }, environment: { id: "env_missing" } },
      actorType: "user",
      actorId: "usr_x",
      actionType: "login_failure",
      payload: {},
    });
    expect(errorSpy).toHaveBeenCalledWith(
      "audit_write_failed",
      expect.objectContaining({ actionType: "login_failure" }),
    );
  });
});

describe("auditContextForEnvironment", () => {
  it("resolves tenant+environment scope or undefined when unknown", async () => {
    const ctx = await auditContextForEnvironment(environmentId);
    expect(ctx?.environment.id).toBe(environmentId);
    expect(ctx?.tenant.id).toBe(tenantId);
    expect(await auditContextForEnvironment("env_does_not_exist")).toBeUndefined();
  });
});
