import { and, eq } from "drizzle-orm";
import { decryptSecret, randomToken, sha256Hex, signToken } from "@sdk-e/engine";
import type { JWK } from "jose";
import { applications, refreshTokens, users, getDb } from "@sdk-e/db";
import { TOKEN_LIFETIMES_SECONDS } from "@sdk-e/shared";
import type { AuthContext } from "./context";
import { getActivePrivateJwk } from "./keys";

export type ApplicationRow = typeof applications.$inferSelect;
export type UserRow = typeof users.$inferSelect;

const REFRESH_BYTES = 48;

export function normalizeRequestedScope(scope: string[]): string[] {
  const allowed = new Set(["openid", "email", "profile", "offline_access"]);
  return scope.filter((s) => allowed.has(s));
}

export function hasRefreshGrant(app: ApplicationRow): boolean {
  return app.grantTypes.includes("refresh_token");
}

export class TokenError extends Error {
  constructor(
    public error: string,
    public description: string,
    public status = 400,
  ) {
    super(description);
  }
}

export async function issueTokens(params: {
  ctx: AuthContext;
  app: ApplicationRow;
  user: UserRow;
  sessionId?: string | null;
  scope: string[];
  nonce?: string | null;
  refreshFamilyId?: string;
  replacesRefreshId?: string;
}): Promise<{
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const db = getDb();
  const { privateJwk, kid } = await getActivePrivateJwk(params.ctx.environment.id);
  const scopeString = params.scope.join(" ");

  const access_token = await signToken({
    privateJwk: privateJwk as JWK,
    kid,
    issuer: params.ctx.issuer,
    subject: params.user.id,
    audience: params.app.clientId,
    lifetimeSeconds: params.app.tokenLifetimeSeconds || TOKEN_LIFETIMES_SECONDS.accessToken,
    claims: {
      scope: scopeString,
      sid: params.sessionId ?? undefined,
      email: params.scope.includes("email") ? params.user.email : undefined,
    },
  });

  let id_token: string | undefined;
  if (params.scope.includes("openid")) {
    id_token = await signToken({
      privateJwk: privateJwk as JWK,
      kid,
      issuer: params.ctx.issuer,
      subject: params.user.id,
      audience: params.app.clientId,
      lifetimeSeconds: TOKEN_LIFETIMES_SECONDS.idToken,
      claims: {
        ...(params.nonce ? { nonce: params.nonce } : {}),
        ...idTokenClaims(params.user, params.scope),
      },
    });
  }

  let refresh_token: string | undefined;
  if (hasRefreshGrant(params.app)) {
    refresh_token = randomToken(REFRESH_BYTES);
    const inserted = await db
      .insert(refreshTokens)
      .values({
        familyId: params.refreshFamilyId,
        sessionId: params.sessionId ?? null,
        applicationId: params.app.id,
        userId: params.user.id,
        tokenHash: sha256Hex(refresh_token),
        scope: scopeString,
        expiresAt: new Date(Date.now() + TOKEN_LIFETIMES_SECONDS.refreshTokenAbsolute * 1000),
      })
      .returning();
    const child = inserted[0];
    if (child && params.replacesRefreshId) {
      await db
        .update(refreshTokens)
        .set({ replacedById: child.id })
        .where(eq(refreshTokens.id, params.replacesRefreshId));
    }
  }

  return {
    access_token,
    id_token,
    refresh_token,
    expires_in: params.app.tokenLifetimeSeconds || TOKEN_LIFETIMES_SECONDS.accessToken,
  };
}

function idTokenClaims(user: UserRow, scope: string[]): Record<string, unknown> {
  const claims: Record<string, unknown> = {};
  if (scope.includes("email")) {
    claims.email = user.email;
    claims.email_verified = user.emailVerified;
  }
  if (scope.includes("profile")) {
    claims.name = [user.givenName, user.familyName].filter(Boolean).join(" ") || user.nickname || undefined;
    claims.given_name = user.givenName ?? undefined;
    claims.family_name = user.familyName ?? undefined;
    claims.nickname = user.nickname ?? undefined;
    claims.picture = user.pictureUrl ?? undefined;
    claims.locale = user.locale;
  }
  return Object.fromEntries(Object.entries(claims).filter(([, v]) => v !== undefined));
}

export async function rotateRefreshToken(params: {
  ctx: AuthContext;
  app: ApplicationRow;
  refreshToken: string;
}): Promise<NonNullable<Awaited<ReturnType<typeof issueTokens>>> & { userId: string; sessionId: string | null }> {
  const db = getDb();
  const hash = sha256Hex(params.refreshToken);

  const [existing] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hash))
    .limit(1);

  if (!existing) throw new TokenError("invalid_grant", "refresh token not recognized");

  if (existing.consumedAt) {
    await revokeFamily(existing.familyId, existing.userId, "refresh_token_reuse");
    throw new TokenError("invalid_grant", "refresh token reuse detected; family revoked", 400);
  }

  if (existing.revokedAt || existing.expiresAt.getTime() < Date.now()) {
    throw new TokenError("invalid_grant", "refresh token expired or revoked");
  }

  if (
    existing.applicationId !== params.app.id ||
    (params.ctx.environment && false)
  ) {
    throw new TokenError("invalid_grant", "refresh token does not belong to this client");
  }

  const [user] = await db.select().from(users).where(eq(users.id, existing.userId)).limit(1);
  if (!user || user.blocked) throw new TokenError("invalid_grant", "user is blocked or missing");

  const [consumed] = await db
    .update(refreshTokens)
    .set({ consumedAt: new Date() })
    .where(and(eq(refreshTokens.id, existing.id), eq(refreshTokens.tokenHash, hash)))
    .returning();
  void consumed;

  const tokens = await issueTokens({
    ctx: params.ctx,
    app: params.app,
    user,
    sessionId: existing.sessionId,
    scope: (existing.scope ?? "").split(/\s+/).filter(Boolean),
    refreshFamilyId: existing.familyId,
    replacesRefreshId: existing.id,
  });

  return { ...tokens, userId: user.id, sessionId: existing.sessionId };
}

async function revokeFamily(familyId: string, userId: string, reason: string): Promise<void> {
  const db = getDb();
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), reuseDetectedAt: new Date() })
    .where(and(eq(refreshTokens.familyId, familyId), eq(refreshTokens.userId, userId)));
  void reason;
}

export async function verifyClientSecret(app: ApplicationRow, presented: string | undefined): Promise<boolean> {
  if (!app.clientSecretEncrypted) return true;
  if (!presented) return false;
  try {
    return decryptSecret(app.clientSecretEncrypted) === presented;
  } catch {
    return false;
  }
}

export function extractBasicAuth(request: Request): { clientId?: string; clientSecret?: string } {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("basic ")) return {};
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    return { clientId: decoded.slice(0, idx), clientSecret: decoded.slice(idx + 1) };
  } catch {
    return {};
  }
}
