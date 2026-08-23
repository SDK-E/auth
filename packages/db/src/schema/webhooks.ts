import { createId } from "@sdk-e/shared";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { deliveryStatusEnum } from "./_enums.ts";
import { emptyJsonb, timestamps } from "./_shared.ts";
import { environments } from "./tenancy.ts";

export const webhookEndpoints = pgTable(
  "webhook_endpoints",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("hook")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    url: text().notNull(),
    events: text().array().notNull(),
    secretEncrypted: text().notNull(),
    active: boolean().notNull().default(true),
    description: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [index("webhook_endpoints_environment_idx").on(t.environmentId)],
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("dlv")),
    endpointId: text()
      .notNull()
      .references(() => webhookEndpoints.id, { onDelete: "cascade" }),
    eventType: text().notNull(),
    payload: jsonb().notNull().default(emptyJsonb),
    status: deliveryStatusEnum().notNull().default("pending"),
    attempts: integer().notNull().default(0),
    responseStatus: integer(),
    lastError: text(),
    nextRetryAt: timestamp(),
    deliveredAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    index("webhook_deliveries_endpoint_idx").on(t.endpointId, t.createdAt),
    index("webhook_deliveries_retry_idx").on(t.status, t.nextRetryAt),
  ],
);
