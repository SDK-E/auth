import { createId } from "@sdk-e/shared";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  invitationStatusEnum,
  mfaFactorTypeEnum,
  verificationPurposeEnum,
  webauthnDeviceTypeEnum,
} from "./_enums";
import { emptyJsonb, emptyTextArray, timestamps } from "./_shared";
import { connections } from "./connections";
import { environments } from "./tenancy";

export const users = pgTable(
  "users",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("usr")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    connectionId: text().references(() => connections.id, {
      onDelete: "set null",
    }),
    email: text(),
    normalizedEmail: text(),
    emailVerified: boolean().notNull().default(false),
    phone: text(),
    phoneVerified: boolean().notNull().default(false),
    username: text(),
    givenName: text(),
    familyName: text(),
    nickname: text(),
    pictureUrl: text(),
    locale: text().notNull().default("en"),
    passwordHash: text(),
    passwordChangedAt: timestamp(),
    lastLoginAt: timestamp(),
    loginCount: integer().notNull().default(0),
    blocked: boolean().notNull().default(false),
    userMetadata: jsonb()
      .$type<Record<string, unknown>>()
      .notNull()
      .default(emptyJsonb),
    appMetadata: jsonb()
      .$type<Record<string, unknown>>()
      .notNull()
      .default(emptyJsonb),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_environment_normalized_email_idx").on(
      t.environmentId,
      t.normalizedEmail,
    ),
    uniqueIndex("users_environment_username_idx").on(t.environmentId, t.username),
    index("users_environment_phone_idx").on(t.environmentId, t.phone),
  ],
);

export const identities = pgTable(
  "identities",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("idt")),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    connectionId: text().references(() => connections.id, {
      onDelete: "set null",
    }),
    provider: text().notNull(),
    providerUserId: text().notNull(),
    profile: jsonb()
      .$type<Record<string, unknown>>()
      .notNull()
      .default(emptyJsonb),
    isPrimary: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("identities_provider_subject_idx").on(
      t.environmentId,
      t.provider,
      t.providerUserId,
    ),
  ],
);

export const passkeys = pgTable(
  "passkeys",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("passkey")),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialId: text().notNull(),
    publicKey: text().notNull(),
    counter: bigint({ mode: "number" }).notNull().default(0),
    transports: text().array().notNull().default(emptyTextArray),
    deviceType: webauthnDeviceTypeEnum(),
    backupEligible: boolean().notNull().default(false),
    backedUp: boolean().notNull().default(false),
    name: text(),
    lastUsedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [uniqueIndex("passkeys_credential_id_idx").on(t.credentialId)],
);

export const mfaFactors = pgTable(
  "mfa_factors",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("mfa")),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: mfaFactorTypeEnum().notNull(),
    secretEncrypted: text(),
    phone: text(),
    enabled: boolean().notNull().default(false),
    verifiedAt: timestamp(),
    lastUsedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [uniqueIndex("mfa_factors_user_type_idx").on(t.userId, t.type)],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("vtok")),
    userId: text().references(() => users.id, { onDelete: "cascade" }),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    purpose: verificationPurposeEnum().notNull(),
    identifier: text().notNull(),
    tokenHash: text().notNull(),
    expiresAt: timestamp().notNull(),
    consumedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("verification_tokens_hash_idx").on(t.tokenHash),
    index("verification_tokens_identifier_idx").on(
      t.environmentId,
      t.purpose,
      t.identifier,
    ),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("inv")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    organizationId: text(),
    email: text().notNull(),
    roleIds: text().array().notNull().default(emptyTextArray),
    invitedByUserId: text(),
    tokenHash: text().notNull(),
    status: invitationStatusEnum().notNull().default("pending"),
    expiresAt: timestamp().notNull(),
    acceptedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("invitations_token_hash_idx").on(t.tokenHash),
    index("invitations_email_idx").on(t.environmentId, t.email),
  ],
);
