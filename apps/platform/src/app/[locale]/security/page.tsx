import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SecurityView } from "@/components/site/views/security-view";
import { isLocale, locales } from "@/i18n";
import { languageAlternates, loadSiteMessages } from "@/lib/site/messages";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(params: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params.params;
  if (!isLocale(locale)) return {};
  const m = await loadSiteMessages(locale);
  if (!m) return {};
  const path = locale === "en" ? "/security" : `/${locale}/security`;
  return {
    title: m.security.meta.title,
    description: m.security.meta.description,
    alternates: { canonical: path, languages: languageAlternates("/security") },
  };
}

export default async function LocalizedSecurityPage(params: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params.params;
  if (!isLocale(locale)) notFound();
  const m = await loadSiteMessages(locale);
  if (!m) notFound();
  return <SecurityView m={m.security} header={m.header} footer={m.footer} locale={locale} />;
}
