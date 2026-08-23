import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://auth.sdk.enterprises"),
  applicationName: "Auth",
  title: {
    default: "Auth",
    template: "%s · Auth",
  },
  description:
    "Multi-tenant authentication infrastructure by SDK Enterprises — OIDC/OAuth 2.1, universal login, and a full management API.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
