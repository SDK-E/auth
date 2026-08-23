import { eq, sql } from "drizzle-orm";
import { getDb, users } from "@sdk-e/db";
import { AuthError, resolveAuthContext } from "@/lib/auth/context";
import { recordAuthEvent } from "@/lib/auth/events";
import { consumeEmailOtp, safeReturnTo } from "@/lib/auth/login-flow";
import {
  createSession,
  loadActiveSession,
  sessionCookieResponse,
} from "@/lib/auth/sessions";

export const dynamic = "force-dynamic";

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

    const session = await createSession({
      userId,
      environmentId: ctx.environment.id,
      ip: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
      amr: ["email_otp"],
    });

    await db
      .update(users)
      .set({ lastLoginAt: new Date(), loginCount: sql`${users.loginCount} + 1` })
      .where(eq(users.id, userId));

    await recordAuthEvent({
      ctx,
      userId,
      eventType: user.loginCount === 0 ? "signup" : "login_success",
      result: "success",
      ip: session.ip,
      userAgent: session.userAgent,
      details: { method: "email_otp" },
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
