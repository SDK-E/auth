import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocView } from "@/components/site/views/legal-doc-view";
import { isLocale, locales } from "@/i18n";
import { LEGAL_DOC_SLUGS, isLegalDocSlug } from "@/lib/site/legal-docs";
import { languageAlternates, loadSiteMessages } from "@/lib/site/messages";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    LEGAL_DOC_SLUGS.map((doc) => ({ locale, doc })),
  );
}

export async function generateMetadata(params: {
  params: Promise<{ locale: string; doc: string }>;
}): Promise<Metadata> {
  const { locale, doc } = await params.params;
  if (!isLocale(locale) || !isLegalDocSlug(doc)) return {};
  const m = await loadSiteMessages(locale);
  if (!m) return {};
  const catalog = m.legal[doc];
  if (!catalog) return {};
  const path = `/legal/${doc}`;
  return {
    title: catalog.meta.title,
    description: catalog.meta.description,
    alternates: {
      canonical: locale === "en" ? path : `/${locale}${path}`,
      languages: languageAlternates(path),
    },
  };
}

export default async function LocalizedLegalDocPage(params: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale, doc } = await params.params;
  if (!isLocale(locale)) notFound();
  if (!isLegalDocSlug(doc)) notFound();
  const m = await loadSiteMessages(locale);
  if (!m) notFound();
  const catalog = m.legal[doc];
  if (!catalog) notFound();
  return (
    <LegalDocView
      doc={catalog}
      shell={m.legalShell}
      footer={m.footer}
      base={locale === "en" ? "" : `/${locale}`}
      locale={locale}
      slug={doc}
    />
  );
}
