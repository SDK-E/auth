export const LEGAL_DOC_SLUGS = [
  "privacy",
  "terms",
  "dpa",
  "subprocessors",
  "cookies",
  "legal-notice",
] as const;

export type LegalDocSlug = (typeof LEGAL_DOC_SLUGS)[number];

export function isLegalDocSlug(value: string): value is LegalDocSlug {
  return LEGAL_DOC_SLUGS.includes(value as LegalDocSlug);
}
