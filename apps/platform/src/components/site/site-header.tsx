import Link from "next/link";
import Image from "next/image";
import type { HeaderStrings } from "@/i18n/types";

export function SiteHeader(params: { t: HeaderStrings }) {
  const nav = [
    { href: `#platform`, label: params.t.platform },
    { href: `#quickstart`, label: params.t.quickstart },
    { href: `#pricing`, label: params.t.pricing },
  ];
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-[1220px] items-center justify-between px-6">
        <Link
          href="/"
          aria-label="auth. home"
          className="flex items-center transition-opacity duration-150 hover:opacity-90"
        >
          <Image
            src="/brand/auth-wordmark-light.svg"
            alt="auth."
            width={140}
            height={28}
            priority
            unoptimized
            className="h-7 w-auto"
          />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-label uppercase text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/security"
            className="text-label uppercase text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            {params.t.security}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/api/health"
            className="hidden text-label uppercase text-muted-foreground transition-colors duration-150 hover:text-foreground sm:block"
          >
            {params.t.status}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-primary px-[18px] py-2.5 text-label uppercase font-bold text-primary-foreground transition-opacity duration-150 hover:opacity-90"
          >
            {params.t.signIn}
          </Link>
        </div>
      </div>
    </header>
  );
}
