import { ensureActiveSigningKey, getPublicJwks } from "@/lib/auth/keys";
import { resolveAuthContext } from "@/lib/auth/context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const ctx = await resolveAuthContext(request);
    await ensureActiveSigningKey(ctx.environment.id);
    const jwks = await getPublicJwks(ctx.environment.id);
    return Response.json(jwks, {
      headers: { "cache-control": "public, max-age=60" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return Response.json({ error: "server_error", error_description: message }, { status: 400 });
  }
}
