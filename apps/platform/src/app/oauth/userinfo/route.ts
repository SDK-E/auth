import { eq } from "drizzle-orm";
import { getDb, users } from "@sdk-e/db";
import { resolveAuthContext } from "@/lib/auth/context";
import { verifySignedJwt } from "@/lib/auth/verify";

export const dynamic = "force-dynamic";

function unauthorized(description: string) {
  return Response.json(
    { error: "invalid_token", error_description: description },
    {
      status: 401,
      headers: { "www-authenticate": `Bearer realm="platform", error="invalid_token"` },
    },
  );
}

export async function GET(request: Request) {
  return handleUserinfo(request);
}

export async function POST(request: Request) {
  return handleUserinfo(request);
}

async function handleUserinfo(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return unauthorized("missing bearer token");
  }
  const token = authorization.slice(7).trim();

  let issuer: string;
  try {
    const ctx = await resolveAuthContext(request);
    issuer = ctx.issuer;
  } catch {
    return unauthorized("issuer resolution failed");
  }

  let payload: Record<string, unknown>;
  try {
    payload = await verifySignedJwt(token);
  } catch {
    return unauthorized("token verification failed");
  }

  if (payload.iss !== issuer) return unauthorized("token issuer mismatch");
  if (typeof payload.sub !== "string") return unauthorized("token missing subject");

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
  if (!user || user.blocked) return unauthorized("user not found or blocked");

  const scope = typeof payload.scope === "string" ? payload.scope.split(" ") : [];
  const claims: Record<string, unknown> = { sub: user.id };
  if (scope.includes("email")) {
    claims.email = user.email;
    claims.email_verified = user.emailVerified;
  }
  if (scope.includes("profile")) {
    const name = [user.givenName, user.familyName].filter(Boolean).join(" ");
    claims.name = name || user.nickname || undefined;
    claims.given_name = user.givenName ?? undefined;
    claims.family_name = user.familyName ?? undefined;
    claims.nickname = user.nickname ?? undefined;
    claims.picture = user.pictureUrl ?? undefined;
    claims.locale = user.locale;
  }

  return Response.json(
    Object.fromEntries(Object.entries(claims).filter(([, v]) => v !== undefined)),
    { headers: { "cache-control": "no-store" } },
  );
}
