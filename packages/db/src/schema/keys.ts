import { createId } from "@sdk-e/shared";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { emptyJsonb } from "./_shared.ts";
import { environments } from "./tenancy.ts";

export const signingKeys = pgTable(
  "signing_keys",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("skey")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    kid: text().notNull(),
    algorithm: text().notNull().default("RS256"),
    publicJwk: jsonb()
      .$type<Record<string, unknown>>()
      .notNull()
      .default(emptyJsonb),
    encryptedPrivateKey: text().notNull(),
    status: text().notNull().default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    rotatedAt: timestamp(),
  },
  (t) => [
    uniqueIndex("signing_keys_kid_idx").on(t.kid),
    index("signing_keys_env_status_idx").on(t.environmentId, t.status),
  ],
);
