import { NextResponse } from "next/server";
import { sendMail } from "@sdk-e/emails";
import { AuthError, resolveAuthContext } from "@/lib/auth/context";
import { findOrCreateUserByEmail, issueEmailOtp } from "@/lib/auth/login-flow";
import { enforceRateLimit, requestClientIp } from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";

const OTP_PER_EMAIL_LIMIT = 3;
const OTP_PER_EMAIL_WINDOW_SECONDS = 10 * 60;
const OTP_PER_IP_LIMIT = 20;
const OTP_PER_IP_WINDOW_SECONDS = 60 * 60;
const RATE_LIMIT_MESSAGE = "Too many attempts. Try again shortly.";

function redirectTo(request: Request, pathWithQuery: string, status = 303): NextResponse {
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL(pathWithQuery, origin), status);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const returnTo = String(form.get("return_to") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return redirectTo(request, `/u/login?error=${encodeURIComponent("Enter a valid email address.")}`);
  }

  try {
    const ctx = await resolveAuthContext(request);
    const identifier = email.toLowerCase();
    const [emailLimit, ipLimit] = await Promise.all([
      enforceRateLimit(
        "otp_request_email",
        `${ctx.environment.id}:${identifier}`,
        OTP_PER_EMAIL_LIMIT,
        OTP_PER_EMAIL_WINDOW_SECONDS,
      ),
      enforceRateLimit("otp_request_ip", requestClientIp(request), OTP_PER_IP_LIMIT, OTP_PER_IP_WINDOW_SECONDS),
    ]);
    if (!emailLimit.ok || !ipLimit.ok) {
      return redirectTo(
        request,
        `/u/login?error=${encodeURIComponent(RATE_LIMIT_MESSAGE)}`,
      );
    }
    const { userId } = await findOrCreateUserByEmail({
      environmentId: ctx.environment.id,
      email,
    });
    const code = await issueEmailOtp({ environmentId: ctx.environment.id, userId, email });

    const result = await sendMail({
      to: email,
      subject: "Your sign-in code",
      text: `Your verification code is ${code}. It expires in 15 minutes.`,
      html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 15 minutes.</p>`,
    });
    if (!result.ok) {
      return redirectTo(
        request,
        `/u/login?error=${encodeURIComponent("We could not send your sign-in code right now. Please try again in a moment.")}`,
      );
    }

    const params = new URLSearchParams({ email, return_to: returnTo || "/dashboard" });
    return redirectTo(request, `/u/login/verify?${params}`);
  } catch (error) {
    if (error instanceof AuthError) {
      const params = new URLSearchParams({ error: error.message });
      return redirectTo(request, `/u/login?${params}`);
    }
    if (error instanceof Error && error.message === "user_blocked") {
      const params = new URLSearchParams({
        error: encodeURIComponent("This account is blocked."),
      });
      return redirectTo(request, `/u/login?${params}`);
    }
    throw error;
  }
}
