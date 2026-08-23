import type { Metadata } from "next";
import { HomeView } from "@/components/site/views/home-view";
import { defaultLocale } from "@/i18n";
import { languageAlternates, loadSiteMessages } from "@/lib/site/messages";

export async function generateMetadata(): Promise<Metadata> {
  const m = await loadSiteMessages(defaultLocale);
  if (!m) throw new Error("english catalog unavailable");
  return {
    title: m.home.meta.title,
    description: m.home.meta.description,
    alternates: { canonical: "/", languages: languageAlternates("/") },
  };
}

export default async function HomePage() {
  const m = await loadSiteMessages(defaultLocale);
  if (!m) throw new Error("english catalog unavailable");
  return (
    <HomeView
      m={m.home}
      header={m.header}
      footer={m.footer}
      badges={m.statusBadges}
      locale={defaultLocale}
    />
  );
}
