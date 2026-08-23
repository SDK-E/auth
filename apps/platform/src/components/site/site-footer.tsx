import Link from "next/link";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import type { Locale } from "@/i18n";
import type { FooterStrings } from "@/i18n/types";

export function SiteFooter(params: { t: FooterStrings; base: string; locale: Locale }) {
  const groups = [
    {
      title: params.t.productTitle,
      links: [
        { label: params.t.productLinks[0], href: `${params.base}/#platform` },
        { label: params.t.productLinks[1], href: `${params.base}/#quickstart` },
        { label: params.t.productLinks[2], href: `${params.base}/#pricing` },
        { label: params.t.productLinks[3], href: "/api/health", external: true },
      ],
    },
    {
      title: params.t.trustTitle,
      links: [
        { label: params.t.trustLinks[0], href: `${params.base}/security` },
        { label: params.t.trustLinks[1], href: `${params.base}/legal/privacy` },
        { label: params.t.trustLinks[2], href: `${params.base}/legal/dpa` },
        { label: params.t.trustLinks[3], href: `${params.base}/legal/subprocessors` },
        { label: params.t.trustLinks[4], href: `${params.base}/legal/cookies` },
      ],
    },
    {
      title: params.t.legalTitle,
      links: [
        { label: params.t.legalLinks[0], href: `${params.base}/legal/terms` },
        { label: params.t.legalLinks[1], href: `${params.base}/legal/legal-notice` },
      ],
    },
    {
      title: params.t.companyTitle,
      links: [
        { label: params.t.companyLinks[0], href: "https://sdk.enterprises", external: true },
        { label: params.t.companyLinks[1], href: "mailto:hello@sdk.enterprises", external: true },
      ],
    },
  ];

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1220px] px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <p className="text-h3 font-bold">auth.</p>
            <p className="mt-3 max-w-[32ch] text-body text-muted-foreground">{params.t.tagline}</p>
          </div>
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-label uppercase text-muted-foreground">{group.title}</p>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        rel="noopener noreferrer"
                        className="text-body text-foreground underline-offset-4 transition-colors duration-150 hover:text-muted-foreground hover:underline"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-body text-foreground underline-offset-4 transition-colors duration-150 hover:text-muted-foreground hover:underline"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-micro uppercase text-muted-foreground">{params.t.languageLabel}</p>
          <div className="mt-3">
            <LocaleSwitcher current={params.locale} />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-micro uppercase text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {params.t.entityLine}
          </span>
          <span>auth.sdk.enterprises — {params.t.frenchLawLine}</span>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-micro uppercase text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {params.t.entityLine}
          </span>
          <span>auth.sdk.enterprises — {params.t.frenchLawLine}</span>
        </div>
      </div>
    </footer>
  );
}
