import type { Locale } from "@/i18n";

export type Messages = Record<string, unknown>;
type MessageModule = { default: Messages };

export const messageShardPaths = [
  "shared.json",
  "home.json",
  "security.json",
  "legal/privacy.json",
  "legal/terms.json",
  "legal/dpa.json",
  "legal/subprocessors.json",
  "legal/cookies.json",
  "legal/legal-notice.json",
] as const;

const messageShardLoaders: ReadonlyArray<(locale: Locale) => Promise<MessageModule>> = [
  (locale) => import(`../locales/${locale}/shared.json`),
  (locale) => import(`../locales/${locale}/home.json`),
  (locale) => import(`../locales/${locale}/security.json`),
  (locale) => import(`../locales/${locale}/legal/privacy.json`),
  (locale) => import(`../locales/${locale}/legal/terms.json`),
  (locale) => import(`../locales/${locale}/legal/dpa.json`),
  (locale) => import(`../locales/${locale}/legal/subprocessors.json`),
  (locale) => import(`../locales/${locale}/legal/cookies.json`),
  (locale) => import(`../locales/${locale}/legal/legal-notice.json`),
];

export function mergeMessages(target: Messages, source: Messages): Messages {
  const result = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = result[key];
    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue)
    ) {
      result[key] = mergeMessages(targetValue as Messages, sourceValue as Messages);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  }

  return result;
}

export async function loadMessages(locale: Locale): Promise<Messages> {
  const shards = await Promise.all(messageShardLoaders.map((loadShard) => loadShard(locale)));

  return shards.reduce((messages, shard) => mergeMessages(messages, shard.default), {});
}
