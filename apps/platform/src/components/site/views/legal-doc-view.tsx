import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { LEGAL_DOC_SLUGS } from "@/lib/site/legal-docs";
import type { Locale } from "@/i18n";
import type { FooterStrings, LegalDoc, LegalSectionBlock, LegalShellStrings } from "@/i18n/types";

function renderTable(block: { columns: string[]; rows: string[][] }, keyPrefix: string) {
  return (
    <div key={keyPrefix} className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-body">
        <thead>
          <tr className="border-b-2 border-dark text-left">
            {block.columns.map((column) => (
              <th key={column} className="py-3 pr-4 align-bottom text-label uppercase">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={keyPrefix + rowIndex} className="border-b border-border align-top">
              {row.map((cell, cellIndex) => (
                <td
                  key={keyPrefix + rowIndex + cellIndex}
                  className={cellIndex === 0 ? "py-4 pr-4 font-bold" : "py-4 pr-4 text-muted-foreground"}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBlock(block: LegalSectionBlock, keyPrefix: string) {
  if (typeof block === "string") {
    return (
      <p key={keyPrefix}>
        <LinkedText text={block} />
      </p>
    );
  }
  if (Array.isArray(block)) {
    return (
      <ul key={keyPrefix} className="list-disc space-y-1.5 pl-5">
        {block.map((item, index) => (
          <li key={`${keyPrefix}-${index}`}>{item}</li>
        ))}
      </ul>
    );
  }
  return renderTable(block, keyPrefix);
}

function LinkedText(params: { text: string }) {
  const parts = params.text.split(/(hello@sdk\.enterprises)/g);
  return (
    <>
      {parts.map((part, index) =>
        part === "hello@sdk.enterprises" ? (
          <a key={index} href={`mailto:${part}`} className="font-medium underline underline-offset-4">
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function LegalDocView(params: {
  doc: LegalDoc;
  shell: LegalShellStrings;
  footer: FooterStrings;
  base: string;
  locale: Locale;
  slug: string;
}) {
  return (
    <>
      <main className="min-h-dvh">
        <div className="border-b border-border">
          <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-16">
            <p className="text-label uppercase text-muted-foreground">{params.shell.brandContext}</p>
            <h1 className="mt-4 text-h1 font-bold text-balance">{params.doc.title}</h1>
            <p className="mt-4 max-w-[65ch] text-lead text-muted-foreground">{params.doc.description}</p>
            <p className="mt-6 text-micro uppercase text-muted-foreground">
              {params.shell.effectiveLine.replace("{date}", params.doc.updated)}
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.28fr_0.72fr] lg:gap-[50px]">
            <nav aria-label={params.shell.documentsLabel} className="lg:sticky lg:top-8 lg:self-start">
              <p className="text-label uppercase text-muted-foreground">{params.shell.documentsLabel}</p>
              <ul className="mt-4 space-y-2.5">
                {params.shell.docs.map((label, index) => {
                  const slug = LEGAL_DOC_SLUGS[index];
                  if (!slug) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={`${params.base}/legal/${slug}`}
                        className={
                          slug === params.slug
                            ? "text-body font-bold text-foreground underline underline-offset-4"
                            : "text-body text-muted-foreground transition-colors duration-150 hover:text-foreground"
                        }
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <a
                    href={`${params.base}/security`}
                    className="text-body text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {params.shell.securityOverview}
                  </a>
                </li>
              </ul>
            </nav>
            <div className="max-w-[72ch] space-y-8 text-body leading-[1.8] [&_h2]:text-h3 [&_h2]:font-bold [&_p+a]:mt-0">
              {params.doc.sections.map((section, index) => (
                <section key={section.heading || `section-${index}`}>
                  {section.heading ? <h2>{section.heading}</h2> : null}
                  <div className="space-y-4">
                    {section.content.map((block, blockIndex) => renderBlock(block, `${index}-${blockIndex}`))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter t={params.footer} base={params.base} locale={params.locale} />
    </>
  );
}
