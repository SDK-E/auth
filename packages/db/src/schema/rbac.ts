import { createId } from "@sdk-e/shared";
import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared.ts";
import { environments } from "./tenancy.ts";
import { users } from "./users.ts";

export const roles = pgTable(
  "roles",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("role")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    isSystem: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [uniqueIndex("roles_environment_name_idx").on(t.environmentId, t.name)],
);

export const permissions = pgTable(
  "permissions",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("perm")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [uniqueIndex("permissions_environment_name_idx").on(t.environmentId, t.name)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: text()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text()
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("urole")),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    organizationId: text(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    index("user_roles_user_idx").on(t.userId),
    uniqueIndex("user_roles_assignment_idx").on(t.userId, t.roleId, t.organizationId),
  ],
);
