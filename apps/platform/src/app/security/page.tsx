import type { Metadata } from "next";
import { SecurityView } from "@/components/site/views/security-view";
import { defaultLocale } from "@/i18n";
import { languageAlternates, loadSiteMessages } from "@/lib/site/messages";

export async function generateMetadata(): Promise<Metadata> {
  const m = await loadSiteMessages(defaultLocale);
  if (!m) throw new Error("english catalog unavailable");
  return {
    title: m.security.meta.title,
    description: m.security.meta.description,
    alternates: { canonical: "/security", languages: languageAlternates("/security") },
  };
}

export default async function SecurityPage() {
  const m = await loadSiteMessages(defaultLocale);
  if (!m) throw new Error("english catalog unavailable");
  return (
    <SecurityView
      m={m.security}
      header={m.header}
      footer={m.footer}
      locale={defaultLocale}
    />
  );
}
