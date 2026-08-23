import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocView } from "@/components/site/views/legal-doc-view";
import { defaultLocale } from "@/i18n";
import { LEGAL_DOC_SLUGS, isLegalDocSlug } from "@/lib/site/legal-docs";
import { languageAlternates, loadSiteMessages } from "@/lib/site/messages";

export function generateStaticParams() {
  return LEGAL_DOC_SLUGS.map((doc) => ({ doc }));
}

export async function generateMetadata(params: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params.params;
  if (!isLegalDocSlug(doc)) return {};
  const m = await loadSiteMessages(defaultLocale);
  if (!m) return {};
  const catalog = m.legal[doc];
  if (!catalog) return {};
  const suffix = `/legal/${doc}`;
  return {
    title: catalog.meta.title,
    description: catalog.meta.description,
    alternates: { canonical: suffix, languages: languageAlternates(suffix) },
  };
}

export default async function LegalDocPage(params: { params: Promise<{ doc: string }> }) {
  const { doc } = await params.params;
  if (!isLegalDocSlug(doc)) notFound();
  const m = await loadSiteMessages(defaultLocale);
  if (!m) notFound();
  const catalog = m.legal[doc];
  if (!catalog) notFound();
  return (
    <LegalDocView
      doc={catalog}
      shell={m.legalShell}
      footer={m.footer}
      base=""
      locale={defaultLocale}
      slug={doc}
    />
  );
}
