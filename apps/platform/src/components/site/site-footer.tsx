import Link from "next/link";

const GROUPS: Array<{ title: string; links: Array<{ label: string; href: string; external?: boolean }> }> = [
  {
    title: "Product",
    links: [
      { label: "Platform", href: "/#platform" },
      { label: "Quickstart", href: "/#quickstart" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Service status", href: "/api/health" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Security", href: "/security" },
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Data processing (DPA)", href: "/legal/dpa" },
      { label: "Subprocessors", href: "/legal/subprocessors" },
      { label: "Cookies & tracking", href: "/legal/cookies" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "/legal/terms" },
      { label: "Legal notice", href: "/legal/legal-notice" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "SDK Enterprises", href: "https://sdk.enterprises", external: true },
      { label: "Contact", href: "mailto:hello@sdk.enterprises" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1220px] px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <p className="text-h3 font-bold">auth.</p>
            <p className="mt-3 max-w-[32ch] text-body text-muted-foreground">
              Multi-tenant authentication infrastructure by SDK Enterprises.
            </p>
          </div>
          {GROUPS.map((group) => (
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
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-micro uppercase text-muted-foreground">
          <span>© {new Date().getFullYear()} SDK Enterprises · SIREN 850 513 912 · RCS Paris</span>
          <span className="normal-case">auth.sdk.enterprises — governed by French law</span>
        </div>
      </div>
    </footer>
  );
}
