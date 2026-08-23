import { eq } from "drizzle-orm";
import { sha256Hex } from "@sdk-e/engine";
import { beforeEach, describe, expect, it } from "vitest";
import { connections, getDb, users, verificationTokens } from "@sdk-e/db";
import {
  consumeEmailOtp,
  consumeOutstandingEmailOtps,
  ensureEmailConnection,
  findOrCreateUserByEmail,
  issueEmailOtp,
  otpStoreValue,
  safeReturnTo,
} from "./login-flow.ts";
import { seedTenantEnvironment, seedUser } from "../../../tests/support/seed.ts";

let environmentId: string;

beforeEach(async () => {
  const seeded = await seedTenantEnvironment(getDb());
  environmentId = seeded.environment.id;
});

describe("safeReturnTo", () => {
  it("defaults missing or unsafe targets", () => {
    for (const value of [undefined, null, "", "https://evil.example", "//evil.example", "/oauth/token", "/u/login"]) {
      expect(safeReturnTo(value as string | null | undefined)).toBe("/dashboard");
    }
  });

  it("keeps safe relative paths", () => {
    expect(safeReturnTo("/sessions")).toBe("/sessions");
    expect(safeReturnTo("/dashboard/settings")).toBe("/dashboard/settings");
  });

  it("blocks return targets into auth surfaces even when nested-looking", () => {
    expect(safeReturnTo("/u/login/reset")).toBe("/dashboard");
    expect(safeReturnTo("/oauth")).toBe("/dashboard");
  });
});

describe("ensureEmailConnection", () => {
  it("creates exactly one email connection per environment", async () => {
    const first = await ensureEmailConnection(environmentId);
    const second = await ensureEmailConnection(environmentId);
    expect(second.id).toBe(first.id);
    const rows = await getDb()
      .select()
      .from(connections)
      .where(eq(connections.environmentId, environmentId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.strategy).toBe("email");
    expect(rows[0]?.enabled).toBe(true);
  });
});

describe("findOrCreateUserByEmail", () => {
  it("creates a user once then returns the same id", async () => {
    const first = await findOrCreateUserByEmail({ environmentId, email: "New.User@Example.test" });
    expect(first.isNewUser).toBe(true);
    const second = await findOrCreateUserByEmail({ environmentId, email: "new.user@example.test" });
    expect(second.isNewUser).toBe(false);
    expect(second.userId).toBe(first.userId);
  });

  it("normalizes lookup by email case and surrounding whitespace", async () => {
    const created = await findOrCreateUserByEmail({ environmentId, email: "padded@example.test" });
    const found = await findOrCreateUserByEmail({ environmentId, email: "  PADDED@example.test " });
    expect(found.userId).toBe(created.userId);
    expect(found.isNewUser).toBe(false);
  });

  it("refuses blocked users", async () => {
    await seedUser(getDb(), environmentId, { email: "blocked@example.test", blocked: true });
    await expect(
      findOrCreateUserByEmail({ environmentId, email: "blocked@example.test" }),
    ).rejects.toThrow("user_blocked");
  });
});

describe("email OTP lifecycle", () => {
  it("issues a six-digit code and consumes it once, verifying the user", async () => {
    const user = await seedUser(getDb(), environmentId, { email: "otp@example.test" });
    const code = await issueEmailOtp({
      environmentId,
      userId: user.id,
      email: "otp@example.test",
    });
    expect(code).toMatch(/^\d{6}$/);

    const resolved = await consumeEmailOtp({
      environmentId,
      email: "OTP@example.test",
      code,
    });
    expect(resolved).toBe(user.id);

    const [refreshed] = await getDb().select().from(users).where(eq(users.id, user.id)).limit(1);
    expect(refreshed?.emailVerified).toBe(true);

    expect(
      await consumeEmailOtp({ environmentId, email: "otp@example.test", code }),
    ).toBeUndefined();
  });

  it("rejects wrong codes without consuming the real one", async () => {
    const identifier = "wrong-code@example.test";
    const user = await seedUser(getDb(), environmentId, { email: identifier });
    await issueEmailOtp({ environmentId, userId: user.id, email: identifier });
    const result = await consumeEmailOtp({
      environmentId,
      email: identifier,
      code: "000000",
    });
    expect(result).toBeUndefined();

    const outstanding = await getDb()
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.identifier, identifier));
    for (const row of outstanding) {
      expect(row.consumedAt).toBeNull();
    }
  });

  it("rejects expired codes", async () => {
    const db = getDb();
    const identifier = "expired@example.test";
    const user = await seedUser(getDb(), environmentId, { email: identifier });
    const code = await issueEmailOtp({ environmentId, userId: user.id, email: identifier });
    await db
      .update(verificationTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(
        eq(verificationTokens.tokenHash, sha256Hex(otpStoreValue(identifier, code))),
      );
    const result = await consumeEmailOtp({ environmentId, email: identifier, code });
    expect(result).toBeUndefined();
  });

  it("keeps codes scoped per identifier", async () => {
    const userA = await seedUser(getDb(), environmentId, { email: "a@example.test" });
    const userB = await seedUser(getDb(), environmentId, { email: "b@example.test" });
    const codeA = await issueEmailOtp({ environmentId, userId: userA.id, email: "a@example.test" });
    await issueEmailOtp({ environmentId, userId: userB.id, email: "b@example.test" });
    const wrongScope = await consumeEmailOtp({
      environmentId,
      email: String(userB.email),
      code: codeA,
    });
    expect(wrongScope).toBeUndefined();
    const rightScope = await consumeEmailOtp({
      environmentId,
      email: String(userA.email),
      code: codeA,
    });
    expect(rightScope).toBe(userA.id);
  });

  it("consumes every outstanding code on demand", async () => {
    const identifier = "sweep@example.test";
    const sweepee = await seedUser(getDb(), environmentId, { email: identifier });
    await issueEmailOtp({ environmentId, userId: sweepee.id, email: identifier });
    await issueEmailOtp({ environmentId, userId: sweepee.id, email: identifier });
    await consumeOutstandingEmailOtps({ environmentId, email: identifier });

    const outstanding = await getDb()
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.identifier, identifier));
    expect(outstanding.length).toBeGreaterThanOrEqual(2);
    for (const row of outstanding) {
      expect(row.consumedAt).not.toBeNull();
    }
  });
});
