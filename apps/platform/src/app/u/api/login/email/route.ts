import { NextResponse } from "next/server";
import { sendMail } from "@sdk-e/emails";
import { AuthError, resolveAuthContext } from "@/lib/auth/context";
import { findOrCreateUserByEmail, issueEmailOtp } from "@/lib/auth/login-flow";

export const dynamic = "force-dynamic";

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
        `/u/login?error=${encodeURIComponent("Sign-in email could not be sent. Is the local mail sink running (pnpm mail)?")}`,
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
