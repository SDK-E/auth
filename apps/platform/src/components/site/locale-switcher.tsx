"use client";

import { usePathname } from "next/navigation";
import { Flag } from "@/components/site/flags";
import { LOCALE_COOKIE, LOCALE_LABELS, locales, type Locale } from "@/i18n";

function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function LocaleSwitcher(params: { current: Locale }) {
  const pathname = usePathname() || "/";
  const rest =
    params.current !== "en" && pathname.startsWith(`/${params.current}`)
      ? pathname.slice(params.current.length + 1) || "/"
      : pathname;

  function targetFor(locale: Locale): string {
    const suffix = rest === "/" ? "" : rest;
    return locale === "en" ? suffix || "/" : `/${locale}${suffix}`;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {locales.map((locale) => {
        const active = locale === params.current;
        return (
          <li key={locale}>
            <a
              href={targetFor(locale)}
              hrefLang={locale}
              onClick={() => persistLocale(locale)}
              aria-current={active ? "true" : undefined}
              title={LOCALE_LABELS[locale]}
              className={
                active
                  ? "flex items-center gap-2 rounded-full bg-dark px-3 py-1.5 text-micro uppercase font-bold text-light"
                  : "flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-micro uppercase font-bold text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
              }
            >
              <Flag locale={locale} />
              {LOCALE_LABELS[locale]}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
