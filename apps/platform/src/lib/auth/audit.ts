import { desc, eq } from "drizzle-orm";
import { sha256Hex } from "@sdk-e/engine";
import { auditLogs, environments, getDb, tenants } from "@sdk-e/db";

export type AuditActorType = "user" | "staff" | "client" | "system";

export type AuditActionType =
  | "login_success"
  | "login_failure"
  | "logout"
  | "token_issued"
  | "token_refreshed"
  | "refresh_reuse_detected"
  | "token_revoked"
  | "signing_key_created";

type AuditScopeContext = {
  tenant: { id: string };
  environment: { id: string };
};

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}

export async function computeAuditChainHead(environmentId: string): Promise<string> {
  const db = getDb();
  const [last] = await db
    .select({ entryHash: auditLogs.entryHash })
    .from(auditLogs)
    .where(eq(auditLogs.environmentId, environmentId))
    .orderBy(desc(auditLogs.seq))
    .limit(1);
  return last?.entryHash ?? "0";
}

export function computeAuditEntryHash(prevHash: string, fields: Record<string, unknown>): string {
  return sha256Hex(`${prevHash}${canonicalJson(fields)}`);
}

export async function recordAudit(params: {
  ctx: AuditScopeContext;
  actorType: AuditActorType;
  actorId: string;
  actionType: AuditActionType;
  targetType?: string | null;
  targetId?: string | null;
  payload?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    const occurredAt = new Date();
    const previousHash = await computeAuditChainHead(params.ctx.environment.id);
    const fields = {
      tenantId: params.ctx.tenant.id,
      environmentId: params.ctx.environment.id,
      actorType: params.actorType,
      actorId: params.actorId,
      actionType: params.actionType,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      payload: params.payload ?? {},
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
      occurredAt: occurredAt.toISOString(),
    };
    const entryHash = computeAuditEntryHash(previousHash, fields);
    await getDb().insert(auditLogs).values({
      tenantId: params.ctx.tenant.id,
      environmentId: params.ctx.environment.id,
      actorType: params.actorType,
      actorId: params.actorId,
      actionType: params.actionType,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      payload: params.payload ?? {},
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
      previousHash,
      entryHash,
      occurredAt,
    });
  } catch (error) {
    console.error("audit_write_failed", {
      actionType: params.actionType,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function auditContextForEnvironment(
  environmentId: string,
): Promise<AuditScopeContext | undefined> {
  const db = getDb();
  const [environment] = await db
    .select()
    .from(environments)
    .where(eq(environments.id, environmentId))
    .limit(1);
  if (!environment) return undefined;
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, environment.tenantId)).limit(1);
  if (!tenant) return undefined;
  return { tenant, environment };
}
