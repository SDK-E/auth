import { defaultLocale, isLocale, locales } from "@/i18n";
import { loadMessages, type Messages } from "@/i18n/messages";
import type {
  FooterStrings,
  HeaderStrings,
  LegalDoc,
  LegalShellStrings,
  StatusBadgeStrings,
} from "@/i18n/types";
import type { HomeMessages } from "@/components/site/views/home-view";
import type { SecurityMessages } from "@/components/site/views/security-view";

export type SiteMessages = {
  header: HeaderStrings;
  footer: FooterStrings;
  statusBadges: StatusBadgeStrings;
  legalShell: LegalShellStrings;
  home: HomeMessages;
  security: SecurityMessages;
  legal: Record<string, LegalDoc>;
};

export function toSiteMessages(messages: Messages): SiteMessages {
  const cast = messages as unknown as SiteMessages & { [key: string]: unknown };
  return {
    header: cast.header as HeaderStrings,
    footer: cast.footer as FooterStrings,
    statusBadges: cast.statusBadges as StatusBadgeStrings,
    legalShell: cast.legalShell as LegalShellStrings,
    home: cast.home as HomeMessages,
    security: cast.security as SecurityMessages,
    legal: cast.legal as Record<string, LegalDoc>,
  };
}

export async function loadSiteMessages(localeInput: string): Promise<SiteMessages | undefined> {
  if (!isLocale(localeInput)) return undefined;
  return toSiteMessages(await loadMessages(localeInput));
}

export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const prefix = locale === defaultLocale ? "" : `/${locale}`;
    languages[locale] = `${prefix}${path}`;
  }
  return languages;
}

export type LocaleParams = { params: Promise<{ locale: string }> };
export type LocaleDocParams = { params: Promise<{ locale: string; doc: string }> };
