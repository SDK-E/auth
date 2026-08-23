import { createId } from "@sdk-e/shared";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared.ts";

export const staffUsers = pgTable("staff_users", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId("staff")),
  email: text().notNull(),
  normalizedEmail: text().notNull(),
  name: text().notNull(),
  passwordHash: text(),
  totpSecretEncrypted: text(),
  isSuperAdmin: boolean().notNull().default(false),
  lastLoginAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const staffSessions = pgTable(
  "staff_sessions",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("stfses")),
    staffUserId: text()
      .notNull()
      .references(() => staffUsers.id, { onDelete: "cascade" }),
    secretHash: text().notNull(),
    ip: text(),
    userAgent: text(),
    expiresAt: timestamp().notNull(),
    revokedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("staff_sessions_secret_hash_idx").on(t.secretHash),
    index("staff_sessions_staff_user_idx").on(t.staffUserId),
  ],
);
