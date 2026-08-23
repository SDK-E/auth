import { sql } from "drizzle-orm";
import { text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@sdk-e/shared";

export function timestamps() {
  return {
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  };
}

export function prefixedId(prefix: string) {
  return text()
    .primaryKey()
    .$defaultFn(() => createId(prefix));
}

export const emptyJsonb = sql`'{}'::jsonb`;
export const emptyTextArray = sql`ARRAY[]::text[]`;

export interface EnvironmentSettings {
  bruteForceProtection?: {
    enabled: boolean;
    maxAttempts: number;
    lockoutMinutes: number;
  };
  botDetectionEnabled?: boolean;
  breachedPasswordCheckEnabled?: boolean;
  passwordPolicy?: {
    minLength: number;
    requireNumber: boolean;
    requireSymbol: boolean;
  };
  sessionIdleMinutes?: number;
}

export interface BrandingConfig {
  primaryColor?: string;
  backgroundColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  locale?: string;
}

export interface DeviceInfo {
  uaPlatform?: string;
  browser?: string;
  os?: string;
}
