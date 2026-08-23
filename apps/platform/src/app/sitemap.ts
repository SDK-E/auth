import type { MetadataRoute } from "next";

const BASE = "https://auth.sdk.enterprises";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/security",
    "/legal/privacy",
    "/legal/terms",
    "/legal/dpa",
    "/legal/subprocessors",
    "/legal/cookies",
    "/legal/legal-notice",
  ];
  return routes.map((route) => ({
    url: `${BASE}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
