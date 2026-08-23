import { createId } from "@sdk-e/shared";
import type { ApplicationRow, UserRow } from "@/lib/auth/tokens";
import type { AuthContext } from "@/lib/auth/context";
import {
  applications,
  domains,
  environments,
  plans,
  tenants,
  users,
  type Db,
} from "@sdk-e/db";

export async function seedPlan(db: Db): Promise<void> {
  await db
    .insert(plans)
    .values({ key: "m3-test-free", name: "M3 Test Free" })
    .onConflictDoNothing();
}

export async function seedTenantEnvironment(
  db: Db,
  opts?: { slug?: string; key?: "development" | "staging" | "production"; isDefault?: boolean },
): Promise<{ tenant: typeof tenants.$inferSelect; environment: typeof environments.$inferSelect }> {
  await seedPlan(db);
  const slug = opts?.slug ?? createId("acme");
  const [tenant] = await db
    .insert(tenants)
    .values({ name: `Tenant ${slug}`, slug, planKey: "m3-test-free" })
    .returning();
  if (!tenant) throw new Error("seed: tenant insert failed");
  const [environment] = await db
    .insert(environments)
    .values({
      tenantId: tenant.id,
      key: opts?.key ?? "development",
      isDefault: opts?.isDefault ?? true,
    })
    .returning();
  if (!environment) throw new Error("seed: environment insert failed");
  return { tenant, environment };
}

export async function seedApplication(
  db: Db,
  environmentId: string,
  overrides: Partial<typeof applications.$inferInsert> = {},
): Promise<ApplicationRow> {
  const [app] = await db
    .insert(applications)
    .values({
      environmentId,
      name: "M3 Test App",
      clientId: createId("client"),
      redirectUris: ["https://app.example/callback"],
      ...overrides,
    })
    .returning();
  if (!app) throw new Error("seed: application insert failed");
  return app;
}

export async function seedUser(
  db: Db,
  environmentId: string,
  overrides: Partial<typeof users.$inferInsert> = {},
): Promise<UserRow> {
  const email = overrides.email ?? `${createId("who")}@example.test`;
  const [user] = await db
    .insert(users)
    .values({
      environmentId,
      email,
      normalizedEmail: email.toLowerCase(),
      ...overrides,
    })
    .returning();
  if (!user) throw new Error("seed: user insert failed");
  return user;
}

export async function seedCustomDomain(
  db: Db,
  params: { tenantId: string; environmentId: string; domain: string },
): Promise<void> {
  await db.insert(domains).values({
    tenantId: params.tenantId,
    environmentId: params.environmentId,
    domain: params.domain,
  });
}

export function authContextFor(
  tenant: typeof tenants.$inferSelect,
  environment: typeof environments.$inferSelect,
): AuthContext {
  return { tenant, environment, issuer: `https://${tenant.slug}.auth.test`, hostKind: "tenant" };
}
