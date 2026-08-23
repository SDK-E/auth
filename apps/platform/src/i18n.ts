export const locales = [
  "en",
  "fr",
  "de",
  "es",
  "pt",
  "it",
  "nl",
  "sv",
  "no",
  "da",
  "fi",
  "pl",
  "cs",
  "hu",
  "ro",
  "bg",
  "el",
] as const;

export const defaultLocale = "en" as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
  it: "Italiano",
  nl: "Nederlands",
  sv: "Svenska",
  no: "Norsk",
  da: "Dansk",
  fi: "Suomi",
  pl: "Polski",
  cs: "Čeština",
  hu: "Magyar",
  ro: "Română",
  bg: "Български",
  el: "Ελληνικά",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
  de: "🇩🇪",
  es: "🇪🇸",
  pt: "🇵🇹",
  it: "🇮🇹",
  nl: "🇳🇱",
  sv: "🇸🇪",
  no: "🇳🇴",
  da: "🇩🇰",
  fi: "🇫🇮",
  pl: "🇵🇱",
  cs: "🇨🇿",
  hu: "🇭🇺",
  ro: "🇷🇴",
  bg: "🇧🇬",
  el: "🇬🇷",
};

export const LOCALE_COOKIE = "sdk_e_locale";

export function parseAcceptLanguage(header: string | null): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      let q = 1;
      for (const param of params) {
        const [key, value] = param.trim().split("=");
        if (key === "q" && value !== undefined) q = Number.parseFloat(value) || 0;
      }
      return { tag: (tag ?? "").toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag);
}

export function matchLocale(tags: string[]): Locale | undefined {
  for (const tag of tags) {
    if (!tag) continue;
    const exact = locales.find((locale) => locale === tag);
    if (exact) return exact;
    const base = tag.split("-")[0];
    const byBase = locales.find((locale) => locale === base);
    if (byBase) return byBase;
  }
  return undefined;
}
