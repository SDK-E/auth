import "./load-env.ts";
import { and, eq } from "drizzle-orm";
import { getDb, signingKeys } from "@sdk-e/db";
import { PLATFORM_TENANT_SLUG } from "@sdk-e/shared";
import { resolveTenantEnvironment } from "../../apps/platform/src/lib/auth/context.ts";
import { rotateSigningKey } from "../../apps/platform/src/lib/auth/keys.ts";

const ENVIRONMENT_KEYS = ["development", "staging", "production"] as const;
type EnvironmentKey = (typeof ENVIRONMENT_KEYS)[number];

async function main() {
  const requested = (process.argv[2] ?? "development") as EnvironmentKey;
  if (!ENVIRONMENT_KEYS.includes(requested)) {
    console.error(`usage: node scripts/db/rotate-keys.ts [${ENVIRONMENT_KEYS.join("|")}]`);
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL missing — source the environment for the target Neon branch first");
    process.exit(1);
  }

  const { tenant, environment } = await resolveTenantEnvironment(PLATFORM_TENANT_SLUG, requested);

  const db = getDb();
  const before = await db
    .select({ kid: signingKeys.kid, createdAt: signingKeys.createdAt })
    .from(signingKeys)
    .where(and(eq(signingKeys.environmentId, environment.id), eq(signingKeys.status, "active")));

  const created = await rotateSigningKey(environment.id);

  console.log(
    `rotated signing keys for ${tenant.slug}/${environment.key}: retired [${before
      .map((k) => k.kid)
      .join(", ")}] -> active ${created.kid}`,
  );
  console.log("retired kids stay published in JWKS (last 3) until natural token expiry");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
