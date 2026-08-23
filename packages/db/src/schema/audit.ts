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
import { actorTypeEnum } from "./_enums";
import { emptyJsonb } from "./_shared";
import { environments, tenants } from "./tenancy";

export const auditLogs = pgTable(
  "audit_logs",
  {
    seq: bigserial({ mode: "number" }).primaryKey(),
    id: text()
      .notNull()
      .$defaultFn(() => createId("audit")),
    tenantId: text().references(() => tenants.id, { onDelete: "set null" }),
    environmentId: text().references(() => environments.id, {
      onDelete: "set null",
    }),
    actorType: actorTypeEnum().notNull(),
    actorId: text().notNull(),
    actionType: text().notNull(),
    targetType: text(),
    targetId: text(),
    payload: jsonb().notNull().default(emptyJsonb),
    ip: text(),
    userAgent: text(),
    previousHash: text(),
    entryHash: text().notNull(),
    occurredAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("audit_logs_id_idx").on(t.id),
    index("audit_logs_scope_time_idx").on(
      t.tenantId,
      t.environmentId,
      t.occurredAt,
    ),
  ],
);
