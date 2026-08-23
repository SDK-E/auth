import { eq } from "drizzle-orm";
import { sha256Hex } from "@sdk-e/engine";
import { applications, getDb, refreshTokens } from "@sdk-e/db";
import { auditContextForEnvironment, recordAudit } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => undefined);
  const token = form?.get("token");
  if (typeof token === "string" && token.length > 0) {
    const db = getDb();
    const hash = sha256Hex(token);
    const [existing] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hash))
      .limit(1);
    if (existing && !existing.revokedAt) {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, existing.id));
      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, existing.applicationId))
        .limit(1);
      const ctx = app ? await auditContextForEnvironment(app.environmentId) : undefined;
      if (ctx) {
        await recordAudit({
          ctx,
          actorType: "client",
          actorId: app?.clientId ?? "unauthenticated",
          actionType: "token_revoked",
          targetType: "refresh_token",
          targetId: existing.id,
          payload: { familyId: existing.familyId },
          ip: request.headers.get("x-forwarded-for"),
          userAgent: request.headers.get("user-agent"),
        });
      }
    }
  }
  return new Response(null, { status: 200 });
}
