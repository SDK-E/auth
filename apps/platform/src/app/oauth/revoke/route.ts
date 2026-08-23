import { eq } from "drizzle-orm";
import { sha256Hex } from "@sdk-e/engine";
import { getDb, refreshTokens } from "@sdk-e/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => undefined);
  const token = form?.get("token");
  if (typeof token === "string" && token.length > 0) {
    const db = getDb();
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, sha256Hex(token)));
  }
  return new Response(null, { status: 200 });
}
