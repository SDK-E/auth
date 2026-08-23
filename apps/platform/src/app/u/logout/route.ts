import { NextResponse } from "next/server";
import { AuthError, resolveAuthContext } from "@/lib/auth/context";
import { loadActiveSession, revokeSession, clearSessionCookie } from "@/lib/auth/sessions";
import { recordAuthEvent } from "@/lib/auth/events";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await loadActiveSession(request);
  if (auth) {
    try {
      const ctx = await resolveAuthContext(request);
      await recordAuthEvent({
        ctx,
        userId: auth.session.userId,
        eventType: "logout",
        result: "success",
      });
    } catch (error) {
      if (!(error instanceof AuthError)) throw error;
    }
    await revokeSession(auth.session.id, "user_logout");
  }
  return clearSessionCookie(request) as unknown as NextResponse;
}
