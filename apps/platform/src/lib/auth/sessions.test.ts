import { eq } from "drizzle-orm";
import { SESSION_COOKIE_NAME } from "@sdk-e/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { getDb, sessions } from "@sdk-e/db";
import {
  clearSessionCookie,
  createSession,
  loadActiveSession,
  readSessionCookie,
  revokeSession,
  sessionCookieOptions,
  sessionCookieResponse,
  signSessionJwt,
} from "./sessions.ts";
import { verifySignedJwt } from "./verify.ts";
import { seedTenantEnvironment, seedUser } from "../../../tests/support/seed.ts";

let environmentId: string;

beforeEach(async () => {
  const seeded = await seedTenantEnvironment(getDb());
  environmentId = seeded.environment.id;
});

function requestWithCookie(url: string, cookie?: string): Request {
  return new Request(url, cookie ? { headers: { cookie } } : {});
}

describe("createSession", () => {
  it("applies configured idle/absolute lifetimes", async () => {
    const user = await seedUser(getDb(), environmentId);
    const before = Date.now();
    const session = await createSession({ userId: user.id, environmentId });
    const after = Date.now();

    expect(session.revokedAt).toBeNull();
    expect(session.amr).toEqual([]);
    expect(session.idleExpiresAt.getTime()).toBeGreaterThanOrEqual(before + 14 * 24 * 3600 * 1000 - 5);
    expect(session.absoluteExpiresAt.getTime()).toBeGreaterThan(session.idleExpiresAt.getTime());
    expect(session.secretHash).toMatch(/^[0-9a-f]{64}$/);
    expect(after).toBeGreaterThan(0);
  });

  it("records ip, user agent and amr", async () => {
    const user = await seedUser(getDb(), environmentId);
    const session = await createSession({
      userId: user.id,
      environmentId,
      ip: "203.0.113.7",
      userAgent: "vitest",
      amr: ["email_otp"],
    });
    expect(session.ip).toBe("203.0.113.7");
    expect(session.userAgent).toBe("vitest");
    expect(session.amr).toEqual(["email_otp"]);
  });
});

describe("cookie helpers", () => {
  it("reads the platform cookie from a multi-cookie header", () => {
    const request = requestWithCookie(
      "https://auth.example/x",
      `other=1; ${SESSION_COOKIE_NAME}=jwt.value.here; extra=2`,
    );
    expect(readSessionCookie(request)).toBe("jwt.value.here");
    expect(readSessionCookie(requestWithCookie("https://auth.example/x"))).toBeUndefined();
  });

  it("secures cookies off localhost and on real hosts", () => {
    expect(sessionCookieOptions(new Request("http://localhost:3000/")).secure).toBe(false);
    expect(sessionCookieOptions(new Request("http://127.0.0.1/")).secure).toBe(false);
    expect(sessionCookieOptions(new Request("https://acme.auth.test/")).secure).toBe(true);
    expect(sessionCookieOptions(new Request("https://acme.auth.test/")).sameSite).toBe("lax");
  });
});

describe("loadActiveSession", () => {
  it("loads a live session with its jwt payload", async () => {
    const db = getDb();
    const user = await seedUser(getDb(), environmentId);
    const session = await createSession({ userId: user.id, environmentId });
    const token = await signSessionJwt({
      session,
      issuer: "https://acme.auth.test",
    });
    const request = requestWithCookie(
      "https://acme.auth.test/dashboard",
      `${SESSION_COOKIE_NAME}=${token}`,
    );

    const loaded = await loadActiveSession(request);
    expect(loaded?.session.id).toBe(session.id);
    expect(loaded?.payload.sid).toBe(session.id);
    expect(loaded?.payload.sub).toBe(user.id);

    const [before] = await db.select().from(sessions).where(eq(sessions.id, session.id)).limit(1);
    await loadActiveSession(request);
    const [refreshed] = await db.select().from(sessions).where(eq(sessions.id, session.id)).limit(1);
    expect(refreshed?.lastUsedAt.getTime()).toBeGreaterThanOrEqual(before!.lastUsedAt.getTime());
  });

  it("returns undefined without a cookie or with garbage", async () => {
    expect(await loadActiveSession(requestWithCookie("https://x/"))).toBeUndefined();
    expect(
      await loadActiveSession(
        requestWithCookie("https://x/", `${SESSION_COOKIE_NAME}=not-a-jwt`),
      ),
    ).toBeUndefined();
  });

  it("rejects revoked sessions", async () => {
    const user = await seedUser(getDb(), environmentId);
    const session = await createSession({ userId: user.id, environmentId });
    await revokeSession(session.id, "test_revoke");
    const token = await signSessionJwt({ session, issuer: "https://x" });
    expect(
      await loadActiveSession(
        requestWithCookie("https://x/", `${SESSION_COOKIE_NAME}=${token}`),
      ),
    ).toBeUndefined();
  });

  it("revokes idle-expired sessions instead of loading them", async () => {
    const db = getDb();
    const user = await seedUser(getDb(), environmentId);
    const session = await createSession({ userId: user.id, environmentId });
    await db
      .update(sessions)
      .set({ idleExpiresAt: new Date(Date.now() - 1000) })
      .where(eq(sessions.id, session.id));

    const token = await signSessionJwt({ session, issuer: "https://x" });
    expect(
      await loadActiveSession(
        requestWithCookie("https://x/", `${SESSION_COOKIE_NAME}=${token}`),
      ),
    ).toBeUndefined();

    const [row] = await db.select().from(sessions).where(eq(sessions.id, session.id)).limit(1);
    expect(row?.revokedAt).not.toBeNull();
    expect(row?.revokedReason).toBe("expired");
  });
});

describe("revokeSession", () => {
  it("sets reason once and is idempotent", async () => {
    const db = getDb();
    const user = await seedUser(getDb(), environmentId);
    const session = await createSession({ userId: user.id, environmentId });
    await revokeSession(session.id, "logout");
    await revokeSession(session.id, "logout_again");

    const [row] = await db.select().from(sessions).where(eq(sessions.id, session.id)).limit(1);
    expect(row?.revokedReason).toBe("logout");
  });
});

describe("session jwt", () => {
  it("verifies against the environment JWKS with expected claims", async () => {
    const user = await seedUser(getDb(), environmentId);
    const session = await createSession({ userId: user.id, environmentId });
    const token = await signSessionJwt({ session, issuer: "https://acme.auth.test" });
    const payload = await verifySignedJwt(token);
    expect(payload.iss).toBe("https://acme.auth.test");
    expect(payload.aud).toBe("platform");
    expect(payload.sid).toBe(session.id);
  });
});

describe("cookie responses", () => {
  it("sets the session cookie on a same-host redirect", async () => {
    const user = await seedUser(getDb(), environmentId);
    const session = await createSession({ userId: user.id, environmentId });
    const response = await sessionCookieResponse({
      request: new Request("https://acme.auth.test/u/api/login/callback"),
      session,
      issuer: "https://acme.auth.test",
      redirectToPath: "/dashboard",
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://acme.auth.test/dashboard");

    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toMatch(/SameSite=lax/i);
  });

  it("clears by expiring the cookie", () => {
    const response = clearSessionCookie(new Request("https://acme.auth.test/logout"), "/goodbye");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/goodbye");
    expect(response.headers.get("set-cookie") ?? "").toMatch(/Max-Age=0/i);
  });
});
