import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SDK-E Auth Platform",
    template: "%s · SDK-E Auth",
  },
  description:
    "Multi-tenant authentication infrastructure by SDK Enterprises — OIDC/OAuth 2.1, universal login, and a full management API.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
