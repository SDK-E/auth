import { createId } from "@sdk-e/shared";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import type { DeviceInfo } from "./_shared.ts";
import { emptyTextArray } from "./_shared.ts";
import { environments } from "./tenancy.ts";
import { users } from "./users.ts";

export const sessions = pgTable(
  "sessions",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("ses")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    secretHash: text().notNull(),
    ip: text(),
    userAgent: text(),
    device: jsonb().$type<DeviceInfo>(),
    amr: text().array(),
    authenticatedAt: timestamp().notNull().defaultNow(),
    lastUsedAt: timestamp().notNull().defaultNow(),
    idleExpiresAt: timestamp().notNull(),
    absoluteExpiresAt: timestamp().notNull(),
    revokedAt: timestamp(),
    revokedReason: text(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    index("sessions_user_idx").on(t.userId),
    index("sessions_environment_last_used_idx").on(t.environmentId, t.lastUsedAt),
  ],
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("rtk")),
    familyId: text()
      .notNull()
      .$defaultFn(() => createId("rfam")),
    sessionId: text().references((): AnyPgColumn => sessions.id, {
      onDelete: "set null",
    }),
    applicationId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text().notNull(),
    scope: text(),
    expiresAt: timestamp().notNull(),
    consumedAt: timestamp(),
    replacedById: text().references((): AnyPgColumn => refreshTokens.id),
    reuseDetectedAt: timestamp(),
    revokedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("refresh_tokens_hash_idx").on(t.tokenHash),
    index("refresh_tokens_family_idx").on(t.familyId),
    index("refresh_tokens_user_app_idx").on(t.userId, t.applicationId),
  ],
);

export const authorizationCodes = pgTable(
  "authorization_codes",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("acode")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    applicationId: text().notNull(),
    userId: text().references(() => users.id, { onDelete: "cascade" }),
    sessionId: text().references((): AnyPgColumn => sessions.id, {
      onDelete: "set null",
    }),
    redirectUri: text().notNull(),
    scope: text().array().notNull().default(emptyTextArray),
    nonce: text(),
    codeChallenge: text().notNull(),
    codeChallengeMethod: text().notNull().default("S256"),
    tokenHash: text().notNull(),
    expiresAt: timestamp().notNull(),
    consumedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("authorization_codes_hash_idx").on(t.tokenHash),
    index("authorization_codes_env_user_idx").on(t.environmentId, t.userId),
  ],
);

export const grants = pgTable(
  "grants",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("grant")),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    applicationId: text().notNull(),
    audience: text(),
    scope: text().array().notNull(),
    approvedAt: timestamp().notNull().defaultNow(),
    lastUsedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("grants_user_app_audience_idx").on(
      t.userId,
      t.applicationId,
      t.audience,
    ),
  ],
);
