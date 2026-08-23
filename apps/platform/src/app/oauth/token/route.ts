import { and, eq } from "drizzle-orm";
import { tokenRequestSchema, verifyPkce } from "@sdk-e/engine";
import { applications, authorizationCodes, getDb, users } from "@sdk-e/db";
import { AuthError, resolveAuthContext } from "@/lib/auth/context";
import {
  TokenError,
  extractBasicAuth,
  issueTokens,
  rotateRefreshToken,
  verifyClientSecret,
} from "@/lib/auth/tokens";
import { recordAuthEvent } from "@/lib/auth/events";

export const dynamic = "force-dynamic";

function oauthError(error: string, description: string, status = 400) {
  return Response.json({ error, error_description: description }, { status });
}

export async function POST(request: Request) {
  let ctx;
  try {
    ctx = await resolveAuthContext(request);
  } catch (error) {
    if (error instanceof AuthError) return oauthError(error.code, error.message);
    throw error;
  }

  const form = await request.formData();
  const raw = Object.fromEntries(form.entries() as Iterable<[string, string]>);
  const parsed = tokenRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return oauthError("invalid_request", "malformed token request");
  }
  const body = parsed.data;

  const basic = extractBasicAuth(request);
  const clientId = body.client_id ?? basic.clientId;
  const clientSecret = basic.clientSecret;

  if (!clientId) return oauthError("invalid_client", "client_id is required", 401);

  const db = getDb();
  const [app] = await db
    .select()
    .from(applications)
    .where(
      and(eq(applications.clientId, clientId), eq(applications.environmentId, ctx.environment.id)),
    )
    .limit(1);
  if (!app) return oauthError("invalid_client", "unknown client for this environment", 401);

  if (!(await verifyClientSecret(app, clientSecret))) {
    return oauthError("invalid_client", "client authentication failed", 401);
  }

  try {
    if (body.grant_type === "authorization_code") {
      return await handleAuthorizationCodeGrant({ request, ctx, app, body });
    }
    if (body.grant_type === "refresh_token") {
      return await handleRefreshGrant({ request, ctx, app, refreshToken: body.refresh_token });
    }
    return oauthError("unsupported_grant_type", `grant_type ${body.grant_type} not supported`);
  } catch (error) {
    if (error instanceof TokenError) return oauthError(error.error, error.description, error.status);
    throw error;
  }
}

async function handleAuthorizationCodeGrant(params: {
  request: Request;
  ctx: Awaited<ReturnType<typeof resolveAuthContext>>;
  app: typeof applications.$inferSelect;
  body: { code?: string; redirect_uri?: string; code_verifier?: string };
}) {
  const db = getDb();
  const { sha256Hex } = await import("@sdk-e/engine");
  if (!params.body.code) return oauthError("invalid_request", "code is required");

  const [code] = await db
    .select()
    .from(authorizationCodes)
    .where(and(eq(authorizationCodes.tokenHash, sha256Hex(params.body.code)), eq(authorizationCodes.environmentId, params.ctx.environment.id)))
    .limit(1);

  if (!code) return oauthError("invalid_grant", "authorization code not recognized");
  if (code.consumedAt || code.expiresAt.getTime() < Date.now()) {
    return oauthError("invalid_grant", "authorization code expired or already used");
  }
  if (code.applicationId !== params.app.id) {
    return oauthError("invalid_grant", "authorization code was issued to another client");
  }
  if (!params.body.redirect_uri || params.body.redirect_uri !== code.redirectUri) {
    return oauthError("invalid_grant", "redirect_uri mismatch");
  }
  if (!params.body.code_verifier || !verifyPkce(params.body.code_verifier, code.codeChallenge)) {
    return oauthError("invalid_grant", "PKCE verification failed");
  }

  await db
    .update(authorizationCodes)
    .set({ consumedAt: new Date() })
    .where(eq(authorizationCodes.id, code.id));

  if (!code.userId) return oauthError("invalid_grant", "authorization code is not bound to a user");

  const [user] = await db.select().from(users).where(eq(users.id, code.userId)).limit(1);
  if (!user || user.blocked) return oauthError("invalid_grant", "user is blocked or missing");

  const tokens = await issueTokens({
    ctx: params.ctx,
    app: params.app,
    user,
    sessionId: code.sessionId,
    scope: code.scope,
    nonce: code.nonce,
  });

  await recordAuthEvent({
    ctx: params.ctx,
    userId: user.id,
    applicationId: params.app.id,
    eventType: "token_issued",
    result: "success",
    ip: params.request.headers.get("x-forwarded-for"),
    userAgent: params.request.headers.get("user-agent"),
    details: { grant: "authorization_code", scope: code.scope },
  });

  return Response.json(tokens, {
    headers: {
      "cache-control": "no-store",
      pragma: "no-cache",
    },
  });
}

async function handleRefreshGrant(params: {
  request: Request;
  ctx: Awaited<ReturnType<typeof resolveAuthContext>>;
  app: typeof applications.$inferSelect;
  refreshToken?: string;
}) {
  if (!params.refreshToken) return oauthError("invalid_request", "refresh_token is required");

  const rotated = await rotateRefreshToken({
    ctx: params.ctx,
    app: params.app,
    refreshToken: params.refreshToken,
  });

  await recordAuthEvent({
    ctx: params.ctx,
    userId: rotated.userId,
    applicationId: params.app.id,
    eventType: "token_refreshed",
    result: "success",
    ip: params.request.headers.get("x-forwarded-for"),
    userAgent: params.request.headers.get("user-agent"),
  });

  return Response.json(
    {
      access_token: rotated.access_token,
      id_token: rotated.id_token,
      refresh_token: rotated.refresh_token,
      expires_in: rotated.expires_in,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
