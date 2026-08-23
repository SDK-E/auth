import { and, eq } from "drizzle-orm";
import { encryptSecret, randomToken } from "@sdk-e/engine";
import {
  applications,
  environments,
  getDb,
  plans,
  tenants,
  users,
} from "@sdk-e/db";
import { PLATFORM_TENANT_SLUG } from "@sdk-e/shared";

const DEV_LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
];

async function ensurePlan(key: string, name: string, includedMau: number, monthlyPriceCents: number) {
  const db = getDb();
  await db
    .insert(plans)
    .values({ key, name, includedMau, monthlyPriceCents })
    .onConflictDoUpdate({
      target: plans.key,
      set: { name, includedMau, monthlyPriceCents },
    });
}

async function ensureTenantAndEnvironments() {
  const db = getDb();
  let [tenant] = await db.select().from(tenants).where(eq(tenants.slug, PLATFORM_TENANT_SLUG)).limit(1);
  if (!tenant) {
    [tenant] = await db
      .insert(tenants)
      .values({ name: "SDK-E Platform", slug: PLATFORM_TENANT_SLUG, planKey: "free" })
      .returning();
  }

  for (const key of ["development", "staging", "production"] as const) {
    const [existing] = await db
      .select()
      .from(environments)
      .where(and(eq(environments.tenantId, tenant.id), eq(environments.key, key)))
      .limit(1);
    if (!existing) {
      await db.insert(environments).values({
        tenantId: tenant.id,
        key,
        isDefault: key === "development",
      });
    }
  }

  return tenant;
}

async function ensurePlatformApps(tenantId: string, environmentKey: string) {
  const db = getDb();
  const [environment] = await db
    .select()
    .from(environments)
    .where(and(eq(environments.tenantId, tenantId), eq(environments.key, environmentKey)))
    .limit(1);
  if (!environment) throw new Error(`missing environment ${environmentKey}`);

  const suffix = environmentKey === "development" ? "dev" : environmentKey === "staging" ? "stg" : "prod";
  const origins =
    environmentKey === "production" ? ["https://auth.sdk.enterprises"] : DEV_LOCAL_ORIGINS;

  const webClientId = `client_platform_${suffix}`;
  const [existingWeb] = await db
    .select()
    .from(applications)
    .where(eq(applications.clientId, webClientId))
    .limit(1);

  let webSecret: string | undefined;
  if (!existingWeb) {
    webSecret = randomToken(32);
    await db.insert(applications).values({
      environmentId: environment.id,
      name: `SDK-E Platform (${environmentKey})`,
      clientId: webClientId,
      clientSecretEncrypted: encryptSecret(webSecret),
      appType: "regular_web",
      firstParty: true,
      redirectUris: origins.map((origin) => `${origin}/dashboard`),
      logoutUris: [],
      webOrigins: origins,
      grantTypes: ["authorization_code", "refresh_token"],
      tokenLifetimeSeconds: 900,
    });
  }

  const spaClientId = `client_platform_spa_${suffix}`;
  const [existingSpa] = await db
    .select()
    .from(applications)
    .where(eq(applications.clientId, spaClientId))
    .limit(1);

  if (!existingSpa) {
    await db.insert(applications).values({
      environmentId: environment.id,
      name: `SDK-E Platform SPA (${environmentKey})`,
      clientId: spaClientId,
      appType: "spa",
      firstParty: true,
      redirectUris: origins.map((origin) => `${origin}/dashboard`),
      logoutUris: [],
      webOrigins: origins,
      grantTypes: ["authorization_code", "refresh_token"],
      tokenLifetimeSeconds: 900,
    });
  }

  return { secret: webSecret };
}

async function ensureOwnerUser(tenantId: string, environmentKey: string) {
  const db = getDb();
  const [environment] = await db
    .select()
    .from(environments)
    .where(and(eq(environments.tenantId, tenantId), eq(environments.key, environmentKey)))
    .limit(1);
  if (!environment) throw new Error(`missing environment ${environmentKey}`);

  const email = "hicham@sdk.enterprises";
  const normalized = email.toLowerCase();

  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.environmentId, environment.id), eq(users.normalizedEmail, normalized)))
    .limit(1);
  if (existing) return existing;

  const [user] = await db
    .insert(users)
    .values({
      environmentId: environment.id,
      email,
      normalizedEmail: normalized,
      emailVerified: true,
      givenName: "Hicham",
      nickname: "hicham",
    })
    .returning();
  return user;
}

async function main() {
  await ensurePlan("free", "Free", 1000, 0);
  await ensurePlan("pro", "Pro", 10000, 3500);
  const tenant = await ensureTenantAndEnvironments();

  for (const key of ["development", "staging", "production"] as const) {
    if (key === "staging") continue;
    const { secret } = await ensurePlatformApps(tenant.id, key);
    await ensureOwnerUser(tenant.id, key);
    if (secret) {
      console.log(`client_secret for ${key}: ${secret}`);
    }
  }

  console.log("seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
