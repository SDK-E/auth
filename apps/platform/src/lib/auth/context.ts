import { eq } from "drizzle-orm";
import { domains, environments, getDb, tenants } from "@sdk-e/db";
import { HEADER_HOST_KIND, HEADER_TENANT_SLUG, PLATFORM_TENANT_SLUG } from "@sdk-e/shared";
import type { HostKind } from "@sdk-e/shared";

export type AuthContext = {
  tenant: typeof tenants.$inferSelect;
  environment: typeof environments.$inferSelect;
  issuer: string;
  hostKind: HostKind;
};

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function issuerFromRequest(request: Request): string {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto =
    forwardedProto?.split(",")[0]?.trim() ??
    (url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "http" : "https");
  return `${proto}://${url.host}`;
}

export async function resolveAuthContext(request: Request): Promise<AuthContext> {
  const db = getDb();
  const hostKind = (request.headers.get(HEADER_HOST_KIND) ?? "local") as HostKind;
  const slugHeader = request.headers.get(HEADER_TENANT_SLUG);

  if (hostKind === "custom" && !slugHeader) {
    const hostname = new URL(request.url).hostname;
    const [record] = await db.select().from(domains).where(eq(domains.domain, hostname)).limit(1);
    if (!record) throw new AuthError("unknown_domain", `no tenant mapped for ${hostname}`);
    const envs = await db.select().from(environments).where(eq(environments.tenantId, record.tenantId));
    const environment =
      envs.find((e) => e.id === record.environmentId) ?? envs.find((e) => e.isDefault) ?? envs[0];
    if (!environment) throw new AuthError("unknown_environment", "tenant has no environments");
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, record.tenantId)).limit(1);
    if (!tenant) throw new AuthError("unknown_tenant", "domain tenant missing");
    return { tenant, environment, issuer: issuerFromRequest(request), hostKind };
  }

  const slug = slugHeader ?? PLATFORM_TENANT_SLUG;
  const environmentKey = resolveEnvironmentKey(hostKind);

  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (!tenant) throw new AuthError("unknown_tenant", `tenant ${slug} not found`);

  const envs = await db.select().from(environments).where(eq(environments.tenantId, tenant.id));
  const environment =
    envs.find((e) => e.key === environmentKey) ?? envs.find((e) => e.isDefault) ?? envs[0];
  if (!environment) throw new AuthError("unknown_environment", "tenant has no environments");

  return { tenant, environment, issuer: issuerFromRequest(request), hostKind };
}

function resolveEnvironmentKey(hostKind: HostKind): "development" | "staging" | "production" {
  if (hostKind === "local") return "development";
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "staging";
  if (process.env.NODE_ENV === "production") return "production";
  return "development";
}
