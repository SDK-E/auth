import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { authorizeQuerySchema, randomToken, sha256Hex } from "@sdk-e/engine";
import { applications, authorizationCodes, getDb, grants } from "@sdk-e/db";
import { TOKEN_LIFETIMES_SECONDS } from "@sdk-e/shared";
import { AuthError, resolveAuthContext } from "@/lib/auth/context";
import { loadActiveSession } from "@/lib/auth/sessions";
import { recordAuthEvent } from "@/lib/auth/events";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawQuery = Object.fromEntries(url.searchParams.entries());

  const parsed = authorizeQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return Response.json(
      {
        error: "invalid_request",
        error_description: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      },
      { status: 400 },
    );
  }
  const query = parsed.data;

  let ctx;
  try {
    ctx = await resolveAuthContext(request);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.code, error_description: error.message }, { status: 400 });
    }
    throw error;
  }

  const db = getDb();
  const [app] = await db
    .select()
    .from(applications)
    .where(
      and(eq(applications.clientId, query.client_id), eq(applications.environmentId, ctx.environment.id)),
    )
    .limit(1);

  if (!app || !app.redirectUris.includes(query.redirect_uri)) {
    return Response.json({ error: "invalid_client", error_description: "unknown client or redirect_uri" }, { status: 400 });
  }

  const scopes = query.scope.split(" ").filter(Boolean);
  if (!scopes.includes("openid")) {
    return redirectWithError(query.redirect_uri, "invalid_scope", "openid scope is required", query.state);
  }

  const prompt = query.prompt?.split(" ") ?? [];

  if (prompt.includes("none")) {
    const auth = await loadActiveSession(request);
    if (!auth) {
      return redirectWithError(query.redirect_uri, "login_required", "authentication required", query.state);
    }
  }

  const session = await loadActiveSession(request);
  const needsLogin = !session || prompt.includes("login");

  if (needsLogin) {
    const loginUrl = new URL("/u/login", url.origin);
    loginUrl.searchParams.set("return_to", `${url.pathname}${url.search}`);
    const response = NextResponse.redirect(loginUrl.toString(), 302);
    response.headers.set("cache-control", "no-store");
    return response;
  }

  const code = randomToken(32);
  await db.insert(authorizationCodes).values({
    environmentId: ctx.environment.id,
    applicationId: app.id,
    userId: session.session.userId,
    sessionId: session.session.id,
    redirectUri: query.redirect_uri,
    scope: scopes,
    nonce: query.nonce ?? null,
    codeChallenge: query.code_challenge,
    codeChallengeMethod: query.code_challenge_method,
    tokenHash: sha256Hex(code),
    expiresAt: new Date(Date.now() + TOKEN_LIFETIMES_SECONDS.authorizationCode * 1000),
  });

  await db
    .insert(grants)
    .values({
      userId: session.session.userId,
      applicationId: app.id,
      audience: app.clientId,
      scope: scopes,
    })
    .onConflictDoUpdate({
      target: [grants.userId, grants.applicationId, grants.audience],
      set: { scope: scopes, lastUsedAt: new Date() },
    });

  await recordAuthEvent({
    ctx,
    userId: session.session.userId,
    applicationId: app.id,
    eventType: "token_issued",
    result: "success",
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
    details: { step: "authorization_code_issued", scope: scopes },
  });

  const target = new URL(query.redirect_uri);
  target.searchParams.set("code", code);
  if (query.state) target.searchParams.set("state", query.state);

  const response = NextResponse.redirect(target.toString(), 302);
  response.headers.set("cache-control", "no-store");
  return response;
}

function redirectWithError(redirectUri: string, error: string, description: string, state?: string) {
  const target = new URL(redirectUri);
  target.searchParams.set("error", error);
  target.searchParams.set("error_description", description);
  if (state) target.searchParams.set("state", state);
  return Response.redirect(target.toString(), 302);
}
