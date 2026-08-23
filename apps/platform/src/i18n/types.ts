export type HeaderStrings = {
  platform: string;
  quickstart: string;
  pricing: string;
  security: string;
  status: string;
  signIn: string;
};

export type FooterGroup = { title: string; links: string[] };

export type FooterStrings = {
  tagline: string;
  productTitle: string;
  productLinks: string[];
  trustTitle: string;
  trustLinks: string[];
  legalTitle: string;
  legalLinks: string[];
  companyTitle: string;
  companyLinks: string[];
  entityLine: string;
  frenchLawLine: string;
  languageLabel: string;
};

export type LegalShellStrings = {
  brandContext: string;
  effectiveLine: string;
  documentsLabel: string;
  securityOverview: string;
  docs: string[];
};

export type StatusBadgeStrings = { available: string; rollingOut: string; recommended: string };

export type LegalSectionBlock =
  | string
  | string[]
  | { columns: string[]; rows: string[][] };

export type LegalSection = { heading: string; content: LegalSectionBlock[] };

export type LegalDoc = {
  meta: { title: string; description: string };
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
};
