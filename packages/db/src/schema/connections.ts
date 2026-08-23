import { createId } from "@sdk-e/shared";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { connectionStrategyEnum } from "./_enums.ts";
import { emptyJsonb, timestamps } from "./_shared.ts";
import { environments } from "./tenancy.ts";

export const connections = pgTable(
  "connections",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("conn")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    strategy: connectionStrategyEnum().notNull(),
    name: text().notNull(),
    displayName: text(),
    enabled: boolean().notNull().default(true),
    configEncrypted: text().notNull(),
    options: jsonb().$type<Record<string, unknown>>().notNull().default(emptyJsonb),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("connections_environment_name_idx").on(t.environmentId, t.name),
  ],
);
