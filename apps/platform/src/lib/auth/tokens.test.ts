import { eq } from "drizzle-orm";
import { encryptSecret, sha256Hex } from "@sdk-e/engine";
import { beforeEach, describe, expect, it } from "vitest";
import { auditLogs, getDb, refreshTokens, users } from "@sdk-e/db";
import { createSession } from "./sessions.ts";
import {
  extractBasicAuth,
  hasRefreshGrant,
  issueTokens,
  normalizeRequestedScope,
  rotateRefreshToken,
  TokenError,
  verifyClientSecret,
} from "./tokens.ts";
import { verifySignedJwt } from "./verify.ts";
import {
  authContextFor,
  seedApplication,
  seedTenantEnvironment,
  seedUser,
} from "../../../tests/support/seed.ts";

let ctx: ReturnType<typeof authContextFor>;
let environmentId: string;

beforeEach(async () => {
  const seeded = await seedTenantEnvironment(getDb());
  ctx = authContextFor(seeded.tenant, seeded.environment);
  environmentId = seeded.environment.id;
});

describe("normalizeRequestedScope", () => {
  it("keeps only supported scopes in order", () => {
    expect(normalizeRequestedScope(["openid", "admin", "email", "profile", "offline_access"])).toEqual([
      "openid",
      "email",
      "profile",
      "offline_access",
    ]);
    expect(normalizeRequestedScope([])).toEqual([]);
  });
});

describe("hasRefreshGrant", () => {
  it("mirrors the app grant list", async () => {
    const withGrant = await seedApplication(getDb(), environmentId);
    const withoutGrant = await seedApplication(getDb(), environmentId, {
      grantTypes: ["authorization_code"],
    });
    expect(hasRefreshGrant(withGrant)).toBe(true);
    expect(hasRefreshGrant(withoutGrant)).toBe(false);
  });
});

describe("verifyClientSecret", () => {
  it("accepts public apps without a secret", async () => {
    const app = await seedApplication(getDb(), environmentId, { clientSecretEncrypted: null });
    expect(await verifyClientSecret(app, undefined)).toBe(true);
  });

  it("checks confidential secrets and rejects mismatches or corrupt storage", async () => {
    const secret = "s3cret-value";
    const app = await seedApplication(getDb(), environmentId, {
      clientSecretEncrypted: encryptSecret(secret),
    });
    expect(await verifyClientSecret(app, secret)).toBe(true);
    expect(await verifyClientSecret(app, "wrong")).toBe(false);
    expect(await verifyClientSecret(app, undefined)).toBe(false);
    expect(
      await verifyClientSecret(
        { ...app, clientSecretEncrypted: "v1.broken.broken.broken" },
        "anything",
      ),
    ).toBe(false);
  });
});

describe("extractBasicAuth", () => {
  it("parses RFC 6749 basic credentials", () => {
    const header = `Basic ${Buffer.from("client_a:secret_b").toString("base64")}`;
    expect(extractBasicAuth(new Request("https://x/oauth/token", { headers: { authorization: header } }))).toEqual({
      clientId: "client_a",
      clientSecret: "secret_b",
    });
  });

  it("returns empty for missing or non-basic headers", () => {
    for (const authorization of ["Bearer abc", "Basic-not-really"]) {
      expect(
        extractBasicAuth(new Request("https://x/oauth/token", { headers: { authorization } })),
      ).toEqual({});
    }
    expect(extractBasicAuth(new Request("https://x/oauth/token"))).toEqual({});
  });
});

describe("issueTokens", () => {
  it("issues verifiable access + id + refresh tokens for a full-scope request", async () => {
    const app = await seedApplication(getDb(), environmentId, { clientSecretEncrypted: null });
    const user = await seedUser(getDb(), environmentId, {
      email: "full@example.test",
      emailVerified: true,
      givenName: "Ada",
      familyName: "Lovelace",
    });
    const session = await createSession({
      userId: user.id,
      environmentId,
      amr: ["email_otp"],
    });

    const issued = await issueTokens({
      ctx,
      app,
      user,
      sessionId: session.id,
      scope: ["openid", "email", "profile", "offline_access"],
      nonce: "n_123",
    });

    expect(issued.expires_in).toBe(900);
    expect(issued.refresh_token).toMatch(/^[A-Za-z0-9_-]{64}$/);

    const accessPayload = await verifySignedJwt(issued.access_token);
    expect(accessPayload.sub).toBe(user.id);
    expect(accessPayload.aud).toBe(app.clientId);
    expect(accessPayload.iss).toBe(ctx.issuer);
    expect(accessPayload.scope).toBe("openid email profile offline_access");
    expect(accessPayload.sid).toBe(session.id);

    const idPayload = await verifySignedJwt(issued.id_token ?? "");
    expect(idPayload.nonce).toBe("n_123");
    expect(idPayload.email).toBe(user.email);
    expect(idPayload.email_verified).toBe(true);
    expect(idPayload.name).toBe("Ada Lovelace");
    expect(idPayload.given_name).toBe("Ada");
  });

  it("omits id_token without openid scope and omits refresh without the grant", async () => {
    const app = await seedApplication(getDb(), environmentId, {
      grantTypes: ["authorization_code"],
    });
    const user = await seedUser(getDb(), environmentId, { email: "slim@example.test" });

    const issued = await issueTokens({
      ctx,
      app,
      user,
      sessionId: null,
      scope: ["email"],
    });

    expect(issued.id_token).toBeUndefined();
    expect(issued.refresh_token).toBeUndefined();
    const accessPayload = await verifySignedJwt(issued.access_token);
    expect(accessPayload.email).toBe(user.email);
    expect(accessPayload.sid).toBeUndefined();
  });

  it("honors per-app token lifetimes", async () => {
    const app = await seedApplication(getDb(), environmentId, { tokenLifetimeSeconds: 1234 });
    const user = await seedUser(getDb(), environmentId, { email: "ttl@example.test" });
    const issued = await issueTokens({ ctx, app, user, sessionId: null, scope: [] });
    expect(issued.expires_in).toBe(1234);
  });

  it("persists refresh rows hashed, never plaintext", async () => {
    const app = await seedApplication(getDb(), environmentId);
    const user = await seedUser(getDb(), environmentId, { email: "hashed@example.test" });
    const issued = await issueTokens({
      ctx,
      app,
      user,
      sessionId: null,
      scope: ["offline_access"],
    });
    const rows = await getDb()
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, user.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).not.toBe(issued.refresh_token);
    expect(rows[0]?.consumedAt).toBeNull();
    expect(rows[0]?.revokedAt).toBeNull();
  });
});

describe("rotateRefreshToken", () => {
  async function setupFamily(opts?: { grantTypes?: string[] }) {
    const app = await seedApplication(getDb(), environmentId, {
      clientSecretEncrypted: null,
      ...(opts?.grantTypes ? { grantTypes: opts.grantTypes } : {}),
    });
    const user = await seedUser(getDb(), environmentId, { email: "rotate@example.test" });
    const issued = await issueTokens({
      ctx,
      app,
      user,
      sessionId: null,
      scope: ["openid", "offline_access"],
    });
    if (!issued.refresh_token) throw new Error("expected refresh token");
    return { app, user, refreshToken: issued.refresh_token };
  }

  it("rejects unknown tokens", async () => {
    const { app } = await setupFamily();
    await expect(rotateRefreshToken({ ctx, app, refreshToken: "nope" })).rejects.toMatchObject({
      error: "invalid_grant",
    });
  });

  it("rotates: consumes old row, links replacement, returns fresh credentials", async () => {
    const db = getDb();
    const { app, user, refreshToken } = await setupFamily();
    const first = await rotateRefreshToken({ ctx, app, refreshToken });

    expect(first.userId).toBe(user.id);
    expect(first.refresh_token).toBeDefined();
    expect(first.refresh_token).not.toBe(refreshToken);

    const [oldRow] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, shaOf(refreshToken)))
      .limit(1);
    const [newRow] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, shaOf(first.refresh_token ?? "")))
      .limit(1);
    expect(oldRow?.consumedAt).not.toBeNull();
    expect(oldRow?.revokedAt).toBeNull();
    expect(oldRow?.replacedById).toBe(newRow?.id);
    expect(newRow?.familyId).toBe(oldRow?.familyId);
    expect(newRow?.consumedAt).toBeNull();

    const accessPayload = await verifySignedJwt(first.access_token);
    expect(accessPayload.sub).toBe(user.id);
    expect(accessPayload.scope).toContain("offline_access");
  });

  it("detects reuse of a consumed token and revokes the whole family", async () => {
    const db = getDb();
    const { app, refreshToken } = await setupFamily();
    const first = await rotateRefreshToken({ ctx, app, refreshToken });

    await expect(rotateRefreshToken({ ctx, app, refreshToken })).rejects.toBeInstanceOf(TokenError);

    const familyRows = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.applicationId, app.id));
    expect(familyRows.length).toBeGreaterThanOrEqual(2);
    for (const row of familyRows) {
      expect(row.revokedAt).not.toBeNull();
      expect(row.reuseDetectedAt).not.toBeNull();
    }

    const audits = await db.select().from(auditLogs).where(eq(auditLogs.actionType, "refresh_reuse_detected"));
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits[0]?.targetType).toBe("refresh_family");
    expect(String(audits[0]?.actorId)).toBe(app.clientId);
    expect(first).toBeDefined();
  });

  it("rejects reuse even when only one rotation happened, before expiry checks pass", async () => {
    const { app, refreshToken } = await setupFamily();
    await rotateRefreshToken({ ctx, app, refreshToken });
    await expect(rotateRefreshToken({ ctx, app, refreshToken })).rejects.toThrow(/reuse detected/);
  });

  it("rejects expired-but-unconsumed refresh tokens", async () => {
    const db = getDb();
    const { app, refreshToken } = await setupFamily();
    await db
      .update(refreshTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(refreshTokens.tokenHash, shaOf(refreshToken)));
    await expect(rotateRefreshToken({ ctx, app, refreshToken })).rejects.toThrow(/expired or revoked/);
  });

  it("rejects revoked tokens", async () => {
    const db = getDb();
    const { app, refreshToken } = await setupFamily();
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, shaOf(refreshToken)));
    await expect(rotateRefreshToken({ ctx, app, refreshToken })).rejects.toThrow(/expired or revoked/);
  });

  it("rejects when the user became blocked", async () => {
    const db = getDb();
    const { app, user, refreshToken } = await setupFamily();
    await db.update(users).set({ blocked: true }).where(eq(users.id, user.id));
    await expect(rotateRefreshToken({ ctx, app, refreshToken })).rejects.toThrow(/blocked/);
  });

  it("rejects tokens belonging to another application", async () => {
    const { refreshToken } = await setupFamily();
    const otherApp = await seedApplication(getDb(), environmentId, { clientSecretEncrypted: null });
    await expect(rotateRefreshToken({ ctx, app: otherApp, refreshToken })).rejects.toThrow(
      /does not belong/,
    );
  });
});

function shaOf(token: string): string {
  return sha256Hex(token);
}
