import { and, eq } from "drizzle-orm";
import { importJWK, SignJWT, jwtVerify } from "jose";
import { describe, expect, it } from "vitest";
import { getDb, signingKeys } from "@sdk-e/db";
import {
  ensureActiveSigningKey,
  getActivePrivateJwk,
  getPublicJwks,
  importPublicKey,
  rotateSigningKey,
} from "./keys.ts";
import { seedTenantEnvironment } from "../../../tests/support/seed.ts";

describe("signing key lifecycle", () => {
  it("creates one active key per environment and reuses it", async () => {
    const db = getDb();
    const seeded = await seedTenantEnvironment(db);
    const environmentId = seeded.environment.id;

    const first = await ensureActiveSigningKey(environmentId);
    const second = await ensureActiveSigningKey(environmentId);
    expect(second.kid).toBe(first.kid);
    expect(second.encryptedPrivateKey).toBe(first.encryptedPrivateKey);

    const rows = await db
      .select()
      .from(signingKeys)
      .where(eq(signingKeys.environmentId, environmentId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("active");
  });

  it("keeps keys isolated between environments", async () => {
    const db = getDb();
    const a = await seedTenantEnvironment(db);
    const b = await seedTenantEnvironment(db);
    const keyA = await ensureActiveSigningKey(a.environment.id);
    const keyB = await ensureActiveSigningKey(b.environment.id);
    expect(keyA.kid).not.toBe(keyB.kid);
  });

  it("retires the previous active key on rotation", async () => {
    const db = getDb();
    const seeded = await seedTenantEnvironment(db);
    const environmentId = seeded.environment.id;

    const original = await ensureActiveSigningKey(environmentId);
    const rotated = await rotateSigningKey(environmentId);

    expect(rotated.kid).not.toBe(original.kid);

    const rows = await db
      .select()
      .from(signingKeys)
      .where(eq(signingKeys.environmentId, environmentId));
    expect(rows).toHaveLength(2);
    const retired = rows.find((row) => row.kid === original.kid);
    expect(retired?.status).toBe("retired");
    expect(retired?.rotatedAt).not.toBeNull();

    const again = await ensureActiveSigningKey(environmentId);
    expect(again.kid).toBe(rotated.kid);
  });

  it("serves the three newest keys including retired ones in JWKS", async () => {
    const db = getDb();
    const seeded = await seedTenantEnvironment(db);
    const environmentId = seeded.environment.id;

    const first = await ensureActiveSigningKey(environmentId);
    const second = await rotateSigningKey(environmentId);
    await rotateSigningKey(environmentId);
    const fourth = await rotateSigningKey(environmentId);

    const jwks = await getPublicJwks(environmentId);
    const kids = jwks.keys.map((key) => key.kid);
    expect(kids).toHaveLength(3);
    expect(kids).toContain(fourth.kid);
    expect(kids).toContain(second.kid);
    expect(kids).not.toContain(first.kid);
    for (const key of jwks.keys) {
      expect(key.alg).toBe("RS256");
      expect(key.use).toBe("sig");
    }
    expect(await importPublicKey(fourth.kid)).toMatchObject({ kid: fourth.kid });
    expect(await importPublicKey("kid_unknown")).toBeUndefined();

    void db;
  });

  it("hands out a decryptable private JWK matching the active kid", async () => {
    const db = getDb();
    const seeded = await seedTenantEnvironment(db);
    const environmentId = seeded.environment.id;

    await rotateSigningKey(environmentId);
    const active = await ensureActiveSigningKey(environmentId);
    const { privateJwk, kid } = await getActivePrivateJwk(environmentId);

    expect(kid).toBe(active.kid);
    const rows = await db
      .select()
      .from(signingKeys)
      .where(and(eq(signingKeys.environmentId, environmentId), eq(signingKeys.status, "active")));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kid).toBe(kid);

    const signingInput = await importJWK(privateJwk, "RS256");
    const token = await new SignJWT({ probe: true })
      .setProtectedHeader({ alg: "RS256", kid })
      .sign(signingInput);
    const publicJwk = await importPublicKey(kid);
    const verified = await jwtVerify(token, (await importJWK(publicJwk!, "RS256"))!, {
      algorithms: ["RS256"],
    });
    expect(verified.payload.probe).toBe(true);
  });
});
