import { createId } from "@sdk-e/shared";
import {
  bigserial,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { authEventResultEnum, authEventTypeEnum } from "./_enums";
import { emptyJsonb } from "./_shared";
import { environments, tenants } from "./tenancy";
import { users } from "./users";

export const authEvents = pgTable(
  "auth_events",
  {
    seq: bigserial({ mode: "number" }).primaryKey(),
    id: text()
      .notNull()
      .$defaultFn(() => createId("evt")),
    tenantId: text()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    userId: text().references(() => users.id, { onDelete: "set null" }),
    applicationId: text(),
    connectionId: text(),
    eventType: authEventTypeEnum().notNull(),
    result: authEventResultEnum().notNull(),
    failureReason: text(),
    ip: text(),
    country: text(),
    city: text(),
    userAgent: text(),
    details: jsonb().notNull().default(emptyJsonb),
    occurredAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("auth_events_id_idx").on(t.id),
    index("auth_events_env_time_idx").on(t.environmentId, t.occurredAt),
    index("auth_events_user_time_idx").on(t.userId, t.occurredAt),
    index("auth_events_type_time_idx").on(t.eventType, t.occurredAt),
  ],
);
