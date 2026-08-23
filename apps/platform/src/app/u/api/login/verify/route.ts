import { eq, sql } from "drizzle-orm";
import { getDb, users } from "@sdk-e/db";
import { AuthError, resolveAuthContext } from "@/lib/auth/context";
import { recordAudit } from "@/lib/auth/audit";
import { recordAuthEvent } from "@/lib/auth/events";
import { consumeEmailOtp, consumeOutstandingEmailOtps, safeReturnTo } from "@/lib/auth/login-flow";
import { enforceRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import {
  createSession,
  loadActiveSession,
  sessionCookieResponse,
} from "@/lib/auth/sessions";

export const dynamic = "force-dynamic";

const VERIFY_FAILURE_LIMIT = 5;
const VERIFY_FAILURE_WINDOW_SECONDS = 15 * 60;

function redirectTo(request: Request, pathWithQuery: string): Response {
  return Response.redirect(new URL(pathWithQuery, new URL(request.url).origin), 303);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const code = String(form.get("code") ?? "").trim();
  const returnTo = safeReturnTo(String(form.get("return_to") ?? ""));

  if (!email || !/^\d{6}$/.test(code)) {
    return redirectTo(
      request,
      `/u/login/verify?email=${encodeURIComponent(email)}&return_to=${encodeURIComponent(returnTo)}&error=${encodeURIComponent("Enter the 6-digit code.")}`,
    );
  }

  try {
    const ctx = await resolveAuthContext(request);

    const existingSession = await loadActiveSession(request);
    if (existingSession && existingSession.session.environmentId === ctx.environment.id) {
      return redirectTo(request, returnTo);
    }

    const userId = await consumeEmailOtp({
      environmentId: ctx.environment.id,
      email,
      code,
    });
    if (!userId) {
      const identifier = email.toLowerCase();
      const failures = await enforceRateLimit(
        "otp_verify_fail",
        `${ctx.environment.id}:${identifier}`,
        VERIFY_FAILURE_LIMIT,
        VERIFY_FAILURE_WINDOW_SECONDS,
      );
      const lockedOut = failures.count >= VERIFY_FAILURE_LIMIT;
      if (lockedOut) {
        await consumeOutstandingEmailOtps({ environmentId: ctx.environment.id, email });
      }
      await recordAuthEvent({
        ctx,
        eventType: "login_failure",
        result: "failure",
        failureReason: lockedOut ? "verify_rate_limited" : "invalid_code",
        ip: request.headers.get("x-forwarded-for"),
        userAgent: request.headers.get("user-agent"),
        details: { method: "email_otp" },
      });
      await recordAudit({
        ctx,
        actorType: "user",
        actorId: identifier,
        actionType: "login_failure",
        targetType: "email_otp",
        payload: { reason: lockedOut ? "rate_limited_outstanding_otps_consumed" : "invalid_code" },
        ip: request.headers.get("x-forwarded-for"),
        userAgent: request.headers.get("user-agent"),
      });
      return redirectTo(
        request,
        `/u/login/verify?email=${encodeURIComponent(email)}&return_to=${encodeURIComponent(returnTo)}&error=${encodeURIComponent("That code is invalid or expired. Request a new one.")}`,
      );
    }

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.blocked) {
      return redirectTo(request, `/u/login?error=${encodeURIComponent("This account is blocked.")}`);
    }

    await resetRateLimit("otp_verify_fail", `${ctx.environment.id}:${email.toLowerCase()}`);

    const session = await createSession({
      userId,
      environmentId: ctx.environment.id,
      ip: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
      amr: ["email_otp"],
    });

    const isNewUser = user.loginCount === 0;
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), loginCount: sql`${users.loginCount} + 1` })
      .where(eq(users.id, userId));

    await recordAuthEvent({
      ctx,
      userId,
      eventType: isNewUser ? "signup" : "login_success",
      result: "success",
      ip: session.ip,
      userAgent: session.userAgent,
      details: { method: "email_otp" },
    });

    await recordAudit({
      ctx,
      actorType: "user",
      actorId: userId,
      actionType: "login_success",
      targetType: "session",
      targetId: session.id,
      payload: { method: "email_otp", kind: isNewUser ? "signup" : "login" },
      ip: session.ip,
      userAgent: session.userAgent,
    });

    return await sessionCookieResponse({
      request,
      session,
      issuer: ctx.issuer,
      redirectToPath: returnTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return redirectTo(request, `/u/login?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
}
