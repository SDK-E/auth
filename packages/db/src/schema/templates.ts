import { createId } from "@sdk-e/shared";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  emailTemplateKeyEnum,
  integrationProviderEnum,
} from "./_enums.ts";
import { timestamps } from "./_shared.ts";
import { environments } from "./tenancy.ts";

export const emailTemplates = pgTable(
  "email_templates",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("tmpl")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    templateKey: emailTemplateKeyEnum().notNull(),
    locale: text().notNull().default("en"),
    subject: text(),
    bodyHtml: text(),
    bodyText: text(),
    fromAddressOverride: text(),
    enabled: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("email_templates_key_locale_idx").on(
      t.environmentId,
      t.templateKey,
      t.locale,
    ),
  ],
);

export const integrationSettings = pgTable(
  "integration_settings",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("intg")),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    provider: integrationProviderEnum().notNull(),
    credentialsEncrypted: text().notNull(),
    enabled: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("integration_settings_provider_idx").on(t.environmentId, t.provider),
  ],
);
