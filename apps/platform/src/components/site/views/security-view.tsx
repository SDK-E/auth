import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import type { Locale } from "@/i18n";
import type { FooterStrings, HeaderStrings } from "@/i18n/types";

export type SecurityMessages = {
  meta: { title: string; description: string };
  hero: { eyebrow: string; title: string; lead: string };
  layers: Array<{ title: string; points: string[] }>;
  complianceNote: string;
  disclosure: {
    eyebrow: string;
    title: string;
    items: string[];
    privacyLink: string;
    dpaLink: string;
    subprocessorsLink: string;
  };
};

export function SecurityView(params: {
  m: SecurityMessages;
  header: HeaderStrings;
  footer: FooterStrings;
  locale: Locale;
}) {
  const base = params.locale === "en" ? "" : `/${params.locale}`;
  return (
    <>
      <SiteHeader t={params.header} />
      <main className="min-h-dvh">
        <section className="dark">
          <div className="mx-auto max-w-[1220px] px-6 py-16 md:py-[84px]">
            <p className="text-label uppercase text-fog">{params.m.hero.eyebrow}</p>
            <h1 className="mt-5 max-w-[24ch] text-display font-extrabold md:text-title">
              {params.m.hero.title}
            </h1>
            <p className="mt-6 max-w-[65ch] text-lead text-fog">{params.m.hero.lead}</p>
          </div>
        </section>

        <section className="border-b border-border bg-paper">
          <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-[84px]">
            <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
              {params.m.layers.map((layer) => (
                <article key={layer.title} className="rounded-lg border border-border bg-card p-6">
                  <h2 className="text-h3 font-bold">{layer.title}</h2>
                  <ul className="mt-4 space-y-2.5 text-body text-muted-foreground">
                    {layer.points.map((point) => (
                      <li key={point}>· {point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-[75ch] text-body text-muted-foreground">{params.m.complianceNote}</p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto grid max-w-[1220px] gap-10 px-6 py-12 md:py-[84px] md:grid-cols-[0.65fr_1.35fr] md:gap-[50px]">
            <div>
              <p className="text-label uppercase text-muted-foreground">{params.m.disclosure.eyebrow}</p>
              <h2 className="mt-4 text-h3 font-bold md:text-title">{params.m.disclosure.title}</h2>
            </div>
            <div>
              <ul className="max-w-[70ch] space-y-2.5 text-body text-muted-foreground [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4">
                {params.m.disclosure.items.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-6">
                <Link href={`${base}/legal/privacy`} className="text-label uppercase font-bold underline-offset-4 hover:underline">
                  {params.m.disclosure.privacyLink}
                </Link>
                <Link href={`${base}/legal/dpa`} className="text-label uppercase font-bold underline-offset-4 hover:underline">
                  {params.m.disclosure.dpaLink}
                </Link>
                <Link href={`${base}/legal/subprocessors`} className="text-label uppercase font-bold underline-offset-4 hover:underline">
                  {params.m.disclosure.subprocessorsLink}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter t={params.footer} base={base} locale={params.locale} />
    </>
  );
}
