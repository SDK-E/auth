import { and, eq, gt, isNull } from "drizzle-orm";
import { SignJWT, importJWK } from "jose";
import { NextResponse } from "next/server";
import { randomToken, sha256Hex } from "@sdk-e/engine";
import { getDb, sessions } from "@sdk-e/db";
import { SESSION_COOKIE_NAME, TOKEN_LIFETIMES_SECONDS } from "@sdk-e/shared";
import { getActivePrivateJwk } from "./keys.ts";
import { verifySignedJwt } from "./verify.ts";

export type SessionRow = typeof sessions.$inferSelect;

export async function createSession(params: {
  userId: string;
  environmentId: string;
  ip?: string | null;
  userAgent?: string | null;
  amr?: string[];
}): Promise<SessionRow> {
  const db = getDb();
  const inserted = await db
    .insert(sessions)
    .values({
      userId: params.userId,
      environmentId: params.environmentId,
      secretHash: sha256Hex(randomToken()),
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
      amr: params.amr ?? [],
      idleExpiresAt: new Date(Date.now() + TOKEN_LIFETIMES_SECONDS.sessionIdle * 1000),
      absoluteExpiresAt: new Date(Date.now() + TOKEN_LIFETIMES_SECONDS.sessionAbsolute * 1000),
    })
    .returning();
  const session = inserted[0];
  if (!session) throw new Error("failed to create session");
  return session;
}

export function sessionCookieOptions(request: Request) {
  const hostname = new URL(request.url).hostname;
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: hostname !== "localhost" && hostname !== "127.0.0.1",
    path: "/",
    maxAge: TOKEN_LIFETIMES_SECONDS.sessionAbsolute,
  };
}

export function readSessionCookie(request: Request): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE_NAME) return rest.join("=");
  }
  return undefined;
}

export async function loadActiveSession(
  request: Request,
): Promise<{ session: SessionRow; payload: Record<string, unknown> } | undefined> {
  const token = readSessionCookie(request);
  if (!token) return undefined;

  let payload: Record<string, unknown>;
  try {
    payload = await verifySignedJwt(token);
  } catch {
    return undefined;
  }

  const sid = typeof payload.sid === "string" ? payload.sid : undefined;
  if (!sid) return undefined;

  const db = getDb();
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sid), isNull(sessions.revokedAt)))
    .limit(1);
  if (!session) return undefined;

  const now = Date.now();
  if (session.absoluteExpiresAt.getTime() < now || session.idleExpiresAt.getTime() < now) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date(), revokedReason: "expired" })
      .where(eq(sessions.id, session.id));
    return undefined;
  }

  await db.update(sessions).set({ lastUsedAt: new Date() }).where(eq(sessions.id, session.id));
  return { session, payload };
}

export async function revokeSession(sessionId: string, reason: string): Promise<void> {
  const db = getDb();
  await db
    .update(sessions)
    .set({ revokedAt: new Date(), revokedReason: reason })
    .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)));
}

export async function signSessionJwt(params: {
  session: SessionRow;
  issuer: string;
}): Promise<string> {
  const { privateJwk, kid } = await getActivePrivateJwk(params.session.environmentId);
  const key = await importJWK({ ...privateJwk, kid }, "RS256");
  return new SignJWT({ sid: params.session.id })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(params.issuer)
    .setSubject(params.session.userId)
    .setAudience("platform")
    .setIssuedAt(Math.floor(Date.now() / 1000))
    .setExpirationTime(Math.floor(params.session.absoluteExpiresAt.getTime() / 1000))
    .sign(key);
}

export async function sessionCookieResponse(params: {
  request: Request;
  session: SessionRow;
  issuer: string;
  redirectToPath: string;
}): Promise<NextResponse> {
  const token = await signSessionJwt({
    session: params.session,
    issuer: params.issuer,
  });
  const response = NextResponse.redirect(
    new URL(params.redirectToPath, new URL(params.request.url).origin),
    303,
  );
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    ...sessionCookieOptions(params.request),
  });
  return response;
}

export function clearSessionCookie(request: Request, redirectToPath = "/"): NextResponse {
  const response = NextResponse.redirect(new URL(redirectToPath, new URL(request.url).origin), 303);
  response.cookies.set({ name: SESSION_COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return response;
}

export async function findValidSessionsForUser(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        isNull(sessions.revokedAt),
        gt(sessions.absoluteExpiresAt, new Date()),
      ),
    );
}
