import { and, eq } from "drizzle-orm";
import { encryptSecret, sha256Hex } from "@sdk-e/engine";
import { connections, getDb, users, verificationTokens } from "@sdk-e/db";
import { TOKEN_LIFETIMES_SECONDS } from "@sdk-e/shared";

export function safeReturnTo(value: string | undefined | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/oauth") || value.startsWith("/u/login")) return "/dashboard";
  return value;
}

export async function ensureEmailConnection(environmentId: string) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(connections)
    .where(and(eq(connections.environmentId, environmentId), eq(connections.strategy, "email")))
    .limit(1);
  if (existing) return existing;
  const connectionRows = await db
    .insert(connections)
    .values({
      environmentId,
      name: "Email OTP",
      strategy: "email",
      enabled: true,
      configEncrypted: encryptSecret("{}"),
    })
    .returning();
  const connection = connectionRows[0];
  if (!connection) throw new Error("failed to create email connection");
  return connection;
}

export async function findOrCreateUserByEmail(params: {
  environmentId: string;
  email: string;
}): Promise<{ userId: string; isNewUser: boolean }> {
  const db = getDb();
  const normalized = params.email.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.environmentId, params.environmentId), eq(users.normalizedEmail, normalized)))
    .limit(1);
  if (existing) {
    if (existing.blocked) throw new Error("user_blocked");
    return { userId: existing.id, isNewUser: false };
  }
  const connection = await ensureEmailConnection(params.environmentId);
  const createdRows = await db
    .insert(users)
    .values({
      environmentId: params.environmentId,
      connectionId: connection.id,
      email: params.email.trim(),
      normalizedEmail: normalized,
      emailVerified: false,
    })
    .returning();
  const created = createdRows[0];
  if (!created) throw new Error("failed to create user");
  return { userId: created.id, isNewUser: true };
}

export function otpStoreValue(identifier: string, code: string): string {
  return `${identifier.trim().toLowerCase()}|${code}`;
}

export async function issueEmailOtp(params: {
  environmentId: string;
  userId: string;
  email: string;
}): Promise<string> {
  const db = getDb();
  const identifier = params.email.trim().toLowerCase();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.insert(verificationTokens).values({
    environmentId: params.environmentId,
    userId: params.userId,
    purpose: "email_otp",
    identifier,
    tokenHash: sha256Hex(otpStoreValue(identifier, code)),
    expiresAt: new Date(Date.now() + TOKEN_LIFETIMES_SECONDS.verificationToken * 1000),
  });
  return code;
}

export async function consumeEmailOtp(params: {
  environmentId: string;
  email: string;
  code: string;
}): Promise<string | undefined> {
  const db = getDb();
  const identifier = params.email.trim().toLowerCase();
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.environmentId, params.environmentId),
        eq(verificationTokens.purpose, "email_otp"),
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.tokenHash, sha256Hex(otpStoreValue(identifier, params.code))),
      ),
    )
    .limit(1);
  if (!row || row.consumedAt || row.expiresAt.getTime() < Date.now()) return undefined;

  await db
    .update(verificationTokens)
    .set({ consumedAt: new Date() })
    .where(eq(verificationTokens.id, row.id));

  if (row.userId) {
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, row.userId));
  }
  return row.userId ?? undefined;
}
