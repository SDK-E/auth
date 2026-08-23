import { getDb, authEvents } from "@sdk-e/db";
import type { AuthContext } from "./context";

export async function recordAuthEvent(params: {
  ctx: AuthContext;
  userId?: string | null;
  applicationId?: string | null;
  connectionId?: string | null;
  eventType:
    | "signup"
    | "login_success"
    | "login_failure"
    | "logout"
    | "mfa_challenge_issued"
    | "mfa_challenge_passed"
    | "mfa_challenge_failed"
    | "token_issued"
    | "token_refreshed"
    | "token_revoked"
    | "password_changed"
    | "passkey_registered"
    | "passkey_used"
    | "scim_user_provisioned"
    | "scim_user_deprovisioned";
  result: "success" | "failure" | "pending";
  failureReason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await getDb().insert(authEvents).values({
      tenantId: params.ctx.tenant.id,
      environmentId: params.ctx.environment.id,
      userId: params.userId ?? null,
      applicationId: params.applicationId ?? null,
      connectionId: params.connectionId ?? null,
      eventType: params.eventType,
      result: params.result,
      failureReason: params.failureReason ?? null,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
      details: params.details ?? {},
    });
  } catch {
    return;
  }
}
