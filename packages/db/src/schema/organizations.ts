import { createId } from "@sdk-e/shared";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { scimProviderEnum } from "./_enums";
import {
  emptyJsonb,
  emptyTextArray,
  timestamps,
  type BrandingConfig,
} from "./_shared";
import { connections } from "./connections";
import { environments } from "./tenancy";
import { users } from "./users";

export const organizations = pgTable(
  "organizations",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("org")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    name: text().notNull(),
    slug: text().notNull(),
    branding: jsonb().$type<BrandingConfig>().notNull().default(emptyJsonb),
    metadata: jsonb()
      .$type<Record<string, unknown>>()
      .notNull()
      .default(emptyJsonb),
    maxMembers: integer(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [uniqueIndex("organizations_environment_slug_idx").on(t.environmentId, t.slug)],
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.userId] })],
);

export const organizationConnections = pgTable(
  "organization_connections",
  {
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    connectionId: text()
      .notNull()
      .references(() => connections.id, { onDelete: "cascade" }),
    autoMembershipEnabled: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.connectionId] })],
);

export const scimDirectories = pgTable(
  "scim_directories",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("scim")),
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    provider: scimProviderEnum().notNull(),
    bearerTokenEncrypted: text().notNull(),
    syncEnabled: boolean().notNull().default(true),
    lastSyncedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    index("scim_directories_environment_idx").on(t.environmentId),
  ],
);
