import { createId } from "@sdk-e/shared";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { EnvironmentSettings } from "./_shared";
import {
  domainKindEnum,
  environmentKeyEnum,
  subscriptionSourceEnum,
  subscriptionStatusEnum,
  tenantStatusEnum,
  usageMetricEnum,
} from "./_enums";

export const plans = pgTable("plans", {
  key: text().primaryKey(),
  name: text().notNull(),
  includedMau: integer().notNull().default(0),
  monthlyPriceCents: integer().notNull().default(0),
  features: jsonb()
    .$type<Record<string, boolean | number | string>>()
    .notNull()
    .default({}),
});

export const tenants = pgTable(
  "tenants",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("tenant")),
    name: text().notNull(),
    slug: text().notNull(),
    status: tenantStatusEnum().notNull().default("active"),
    stripeCustomerId: text(),
    planKey: text()
      .notNull()
      .references(() => plans.key),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [uniqueIndex("tenants_slug_idx").on(t.slug)],
);

export const environments = pgTable(
  "environments",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("env")),
    tenantId: text()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    key: environmentKeyEnum().notNull(),
    isDefault: boolean().notNull().default(false),
    settings: jsonb().$type<EnvironmentSettings>().notNull().default({}),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [uniqueIndex("environments_tenant_key_idx").on(t.tenantId, t.key)],
);

export const domains = pgTable(
  "domains",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("dom")),
    tenantId: text()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    domain: text().notNull(),
    kind: domainKindEnum().notNull().default("custom"),
    verificationToken: text(),
    verifiedAt: timestamp(),
    vercelDomainId: text(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [uniqueIndex("domains_domain_idx").on(t.domain)],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("sub")),
    tenantId: text()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    planKey: text()
      .notNull()
      .references(() => plans.key),
    status: subscriptionStatusEnum().notNull().default("trialing"),
    source: subscriptionSourceEnum().notNull().default("direct"),
    stripeSubscriptionId: text(),
    currentPeriodEnd: timestamp(),
    cancelAtPeriodEnd: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("subscriptions_stripe_id_idx").on(t.stripeSubscriptionId),
    index("subscriptions_tenant_idx").on(t.tenantId),
  ],
);

export const usageDaily = pgTable(
  "usage_daily",
  {
    environmentId: text()
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    date: date().notNull(),
    mau: integer().notNull().default(0),
    logins: integer().notNull().default(0),
    signups: integer().notNull().default(0),
    tokensIssued: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.environmentId, t.date] })],
);

export const usageRecords = pgTable(
  "usage_records",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId("usagerec")),
    tenantId: text()
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    metric: usageMetricEnum().notNull(),
    periodStart: date().notNull(),
    periodEnd: date().notNull(),
    quantity: integer().notNull().default(0),
    reportedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("usage_records_period_idx").on(
      t.tenantId,
      t.metric,
      t.periodStart,
    ),
  ],
);
