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
import { applicationTypeEnum } from "./_enums.ts";
import { emptyJsonb, emptyTextArray, timestamps } from "./_shared.ts";
import { connections } from "./connections.ts";
import { environments } from "./tenancy.ts";

export const applications = pgTable(
  "applications",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("app")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    name: text().notNull(),
    clientId: text()
      .notNull()
      .$defaultFn(() => createId("client")),
    clientSecretEncrypted: text(),
    appType: applicationTypeEnum().notNull().default("regular_web"),
    firstParty: boolean().notNull().default(false),
    redirectUris: text().array().notNull().default(emptyTextArray),
    logoutUris: text().array().notNull().default(emptyTextArray),
    webOrigins: text().array().notNull().default(emptyTextArray),
    grantTypes: text()
      .array()
      .notNull()
      .default(["authorization_code", "refresh_token"]),
    tokenLifetimeSeconds: integer().notNull().default(900),
    logoUrl: text(),
    metadata: jsonb()
      .$type<Record<string, unknown>>()
      .notNull()
      .default(emptyJsonb),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("applications_client_id_idx").on(t.clientId),
    index("applications_environment_idx").on(t.environmentId),
  ],
);

export const applicationConnections = pgTable(
  "application_connections",
  {
    applicationId: text()
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    connectionId: text()
      .notNull()
      .references(() => connections.id, { onDelete: "cascade" }),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.applicationId, t.connectionId] })],
);

export const managementClients = pgTable(
  "management_clients",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("m2m")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    name: text().notNull(),
    clientId: text()
      .notNull()
      .$defaultFn(() => createId("m2mcli")),
    clientSecretHash: text().notNull(),
    scopes: text().array().notNull().default(emptyTextArray),
    lastUsedAt: timestamp(),
    revokedAt: timestamp(),
    createdByStaffId: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [uniqueIndex("management_clients_client_id_idx").on(t.clientId)],
);
