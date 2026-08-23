import type { MetadataRoute } from "next";
import { locales } from "@/i18n";

const BASE = "https://auth.sdk.enterprises";

const ROUTES = [
  "",
  "/security",
  "/legal/privacy",
  "/legal/terms",
  "/legal/dpa",
  "/legal/subprocessors",
  "/legal/cookies",
  "/legal/legal-notice",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${BASE}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
    alternates: {
      languages: Object.fromEntries(
        locales.map((locale) => [
          locale,
          `${BASE}${locale === "en" ? "" : `/${locale}`}${route}`,
        ]),
      ),
    },
  }));
}
