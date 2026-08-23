import { and, desc, eq } from "drizzle-orm";
import type { JWK } from "jose";
import { decryptSecret, generateSigningKey, encryptSecret, type KeyMaterial } from "@sdk-e/engine";
import { getDb, signingKeys } from "@sdk-e/db";
import { createId, idPrefixes } from "@sdk-e/shared";

export type StoredSigningKey = typeof signingKeys.$inferSelect;

const jwkCache = new Map<string, { key: JWK; fetchedAt: number }>();
const JWKS_CACHE_MS = 60_000;

export async function ensureActiveSigningKey(environmentId: string): Promise<StoredSigningKey> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(signingKeys)
    .where(and(eq(signingKeys.environmentId, environmentId), eq(signingKeys.status, "active")))
    .orderBy(desc(signingKeys.createdAt))
    .limit(1);
  if (existing) return existing;

  const kid = createId(idPrefixes.signingKey);
  const material: KeyMaterial = await generateSigningKey(kid);
  const createdRows = await db
    .insert(signingKeys)
    .values({
      environmentId,
      kid,
      algorithm: "RS256",
      publicJwk: material.publicJwk as Record<string, unknown>,
      encryptedPrivateKey: encryptSecret(JSON.stringify(material.privateJwk)),
      status: "active",
    })
    .returning();
  const created = createdRows[0];
  if (!created) throw new Error("failed to persist signing key");
  jwkCache.delete(kid);
  return created;
}

export async function rotateSigningKey(environmentId: string): Promise<StoredSigningKey> {
  const db = getDb();
  const current = await ensureActiveSigningKey(environmentId);
  await db
    .update(signingKeys)
    .set({ status: "retired", rotatedAt: new Date() })
    .where(and(eq(signingKeys.environmentId, environmentId), eq(signingKeys.status, "active")));
  const created = await ensureActiveSigningKey(environmentId);
  void current;
  return created;
}

export async function getPublicJwks(environmentId: string): Promise<{ keys: Record<string, unknown>[] }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(signingKeys)
    .where(eq(signingKeys.environmentId, environmentId))
    .orderBy(desc(signingKeys.createdAt))
    .limit(3);
  return {
    keys: rows.map((row) => ({ ...row.publicJwk, kid: row.kid, alg: row.algorithm, use: "sig" })),
  };
}

export async function importPublicKey(kid: string): Promise<JWK | undefined> {
  const cached = jwkCache.get(kid);
  if (cached && Date.now() - cached.fetchedAt < JWKS_CACHE_MS) return cached.key;

  const db = getDb();
  const [row] = await db.select().from(signingKeys).where(eq(signingKeys.kid, kid)).limit(1);
  if (!row) return undefined;
  const key = { ...row.publicJwk, kid: row.kid, alg: row.algorithm, use: "sig" } as JWK;
  jwkCache.set(kid, { key, fetchedAt: Date.now() });
  return key;
}

export async function getActivePrivateJwk(environmentId: string): Promise<{
  privateJwk: JWK;
  kid: string;
}> {
  const active = await ensureActiveSigningKey(environmentId);
  const privateJwk = JSON.parse(decryptSecret(active.encryptedPrivateKey)) as JWK;
  return { privateJwk, kid: active.kid };
}
