import { buildDiscoveryMetadata } from "@sdk-e/engine";
import { resolveAuthContext } from "@/lib/auth/context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const ctx = await resolveAuthContext(request);
    return Response.json(buildDiscoveryMetadata({ issuer: ctx.issuer }), {
      headers: { "cache-control": "public, max-age=300" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return Response.json({ error: "server_error", error_description: message }, { status: 400 });
  }
}
