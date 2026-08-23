import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/u/", "/api/", "/oauth", "/authorize"],
      },
    ],
    sitemap: "https://auth.sdk.enterprises/sitemap.xml",
  };
}
