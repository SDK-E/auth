import type { Metadata } from "next";
import { LegalShell } from "@/components/site/legal-shell";

export const metadata: Metadata = {
  title: "Cookies & tracking",
  description:
    "The complete list of what Auth sets in your browser — and why it is shorter than almost any site you have visited.",
};

export default function CookiesPage() {
  return (
    <LegalShell
      title="Cookies & tracking"
      description="Auth surfaces are built to work without tracking you. This page lists every cookie and every analytics mechanism, which is a very short list."
      updated="August 23, 2026"
      activeHref="/legal/cookies"
    >
      <h2>1. Cookies we set</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-body">
          <thead>
            <tr className="border-b-2 border-dark text-left">
              <th className="py-3 pr-4 align-bottom text-label uppercase">Name</th>
              <th className="py-3 pr-4 align-bottom text-label uppercase">Where</th>
              <th className="py-3 align-bottom text-label uppercase">Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border align-top">
              <td className="py-4 pr-4 font-mono text-micro">sdk_e_session</td>
              <td className="py-4 pr-4 text-muted-foreground">Auth dashboard</td>
              <td className="py-4 text-muted-foreground">
                Essential. Keeps you signed in to your tenant dashboard; signed,
                http-only, expires with the session.
              </td>
            </tr>
            <tr className="border-b border-border align-top">
              <td className="py-4 pr-4 font-mono text-micro">(tenant session cookie)</td>
              <td className="py-4 pr-4 text-muted-foreground">Universal login</td>
              <td className="py-4 text-muted-foreground">
                Essential. Issued only when you sign in to a product that uses
                Auth, scoped to that product&apos;s authentication.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        There is no consent banner because there is nothing to consent to: no
        advertising cookies, no cross-site trackers, no social widgets, and no
        fingerprinting scripts run on auth.sdk.enterprises or on hosted login
        pages.
      </p>

      <h2>2. Analytics</h2>
      <p>
        The marketing pages use Vercel Analytics, which is cookieless: it counts
        page views in aggregate without storing identifiers or building profiles
        of individuals. No analytics runs on universal login pages, API
        endpoints, or inside tenants&apos; applications.
      </p>

      <h2>3. Server-side records</h2>
      <p>
        Like any web server we log requests for security operations (abuse
        detection, rate limiting, audit evidence) under our retention rules in
        the privacy policy. These logs are not used to profile visitors of this
        marketing site.
      </p>

      <h2>4. Questions</h2>
      <p>
        Write to <a href="mailto:hello@sdk.enterprises">hello@sdk.enterprises</a>{" "}
        if anything here is unclear.
      </p>
    </LegalShell>
  );
}
