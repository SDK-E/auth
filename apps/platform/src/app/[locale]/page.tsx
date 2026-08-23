import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeView } from "@/components/site/views/home-view";
import { isLocale } from "@/i18n";
import { languageAlternates, loadSiteMessages } from "@/lib/site/messages";
import { locales } from "@/i18n";

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
  const path = locale === "en" ? "/" : `/${locale}`;
  return {
    title: m.home.meta.title,
    description: m.home.meta.description,
    alternates: { canonical: path, languages: languageAlternates("/") },
  };
}

export default async function LocalizedHomePage(params: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params.params;
  if (!isLocale(locale)) notFound();
  const m = await loadSiteMessages(locale);
  if (!m) notFound();
  return (
    <HomeView
      m={m.home}
      header={m.header}
      footer={m.footer}
      badges={m.statusBadges}
      locale={locale}
    />
  );
}
