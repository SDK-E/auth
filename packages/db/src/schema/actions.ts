import { createId } from "@sdk-e/shared";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { actionTriggerEnum } from "./_enums.ts";
import { timestamps } from "./_shared.ts";
import { environments } from "./tenancy.ts";

export const actions = pgTable(
  "actions",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("action")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    name: text().notNull(),
    trigger: actionTriggerEnum().notNull(),
    description: text(),
    enabled: boolean().notNull().default(true),
    currentVersion: integer().notNull().default(0),
    secretsEncrypted: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [uniqueIndex("actions_environment_name_idx").on(t.environmentId, t.name)],
);

export const actionVersions = pgTable(
  "action_versions",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("actver")),
    actionId: text()
      .notNull()
      .references(() => actions.id, { onDelete: "cascade" }),
    version: integer().notNull(),
    code: text().notNull(),
    checksum: text().notNull(),
    createdByStaffId: text(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [uniqueIndex("action_versions_action_version_idx").on(t.actionId, t.version)],
);

export const actionBindings = pgTable(
  "action_bindings",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("binding")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    actionId: text()
      .notNull()
      .references(() => actions.id, { onDelete: "cascade" }),
    trigger: actionTriggerEnum().notNull(),
    position: integer().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("action_bindings_trigger_position_idx").on(
      t.environmentId,
      t.trigger,
      t.position,
    ),
  ],
);
