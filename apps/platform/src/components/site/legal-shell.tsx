import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";

export function LegalShell(params: {
  title: string;
  description: string;
  updated: string;
  activeHref: string;
  children: ReactNode;
}) {
  return (
    <>
      <main className="min-h-dvh">
        <div className="border-b border-border">
          <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-16">
            <p className="text-label uppercase text-muted-foreground">auth. · Legal</p>
            <h1 className="mt-4 text-h1 font-bold text-balance">{params.title}</h1>
            <p className="mt-4 max-w-[65ch] text-lead text-muted-foreground">{params.description}</p>
            <p className="mt-6 text-micro uppercase text-muted-foreground">
              Effective {params.updated} · governed by French law
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.28fr_0.72fr] lg:gap-[50px]">
            <nav aria-label="Legal pages" className="lg:sticky lg:top-8 lg:self-start">
              <p className="text-label uppercase text-muted-foreground">Documents</p>
              <ul className="mt-4 space-y-2.5">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={
                        link.href === params.activeHref
                          ? "text-body font-bold text-foreground underline underline-offset-4"
                          : "text-body text-muted-foreground transition-colors duration-150 hover:text-foreground"
                      }
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/security" className="text-body text-muted-foreground transition-colors duration-150 hover:text-foreground">
                    Security overview
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="max-w-[72ch] space-y-8 text-body leading-[1.8] [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-h3 [&_h2]:font-bold [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
              {params.children}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy policy" },
  { href: "/legal/terms", label: "Terms of service" },
  { href: "/legal/dpa", label: "Data processing addendum" },
  { href: "/legal/subprocessors", label: "Subprocessors" },
  { href: "/legal/cookies", label: "Cookies & tracking" },
  { href: "/legal/legal-notice", label: "Legal notice" },
];
