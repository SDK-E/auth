import type { Metadata } from "next";
import { LegalShell } from "@/components/site/legal-shell";

export const metadata: Metadata = {
  title: "Subprocessors",
  description:
    "The subprocessors SDK Enterprises engages to operate the Auth service, what each one does, and where they run.",
};

const SUBPROCESSORS = [
  {
    name: "Vercel Inc.",
    role: "Application hosting and edge network",
    location: "United States (global edge network)",
    data: "All HTTP traffic to auth.sdk.enterprises, including authentication requests; encrypted in transit; no plaintext secrets at the edge.",
  },
  {
    name: "Neon (Neon Inc.)",
    role: "Managed PostgreSQL databases",
    location: "Cloud region selected per deployment (production: EEA-capable regions)",
    data: "Tenant configuration, user accounts, hashed tokens, sessions, audit ledger. Secrets and private keys are stored only after envelope encryption.",
  },
  {
    name: "Upstash Inc.",
    role: "Rate-limit counters",
    location: "United States (region chosen by Upstash)",
    data: "Numeric counters keyed by email or IP address with automatic expiry of at most one hour. No other personal data.",
  },
  {
    name: "Resend (Resend Technologies, Inc.)",
    role: "Transactional email delivery",
    location: "United States",
    data: "Recipient email address and delivery metadata for sign-in codes. Message bodies contain only the six-digit code and expiry notice.",
  },
];

export default function SubprocessorsPage() {
  return (
    <LegalShell
      title="Subprocessors"
      description="We keep this list current and give at least 14 days' notice of additions before a new subprocessor processes tenant personal data."
      updated="August 23, 2026"
      activeHref="/legal/subprocessors"
    >
      <p>
        Each subprocessor operates under a written agreement imposing
        data-protection obligations consistent with our data processing
        addendum, and we remain responsible for their performance. Objections
        to a new subprocessor can be raised within the notice window by writing
        to <a href="mailto:hello@sdk.enterprises">hello@sdk.enterprises</a>.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-body">
          <thead>
            <tr className="border-b-2 border-dark text-left">
              <th className="py-3 pr-4 align-bottom text-label uppercase">Subprocessor</th>
              <th className="py-3 pr-4 align-bottom text-label uppercase">Role</th>
              <th className="py-3 pr-4 align-bottom text-label uppercase">Location</th>
              <th className="py-3 align-bottom text-label uppercase">Data involved</th>
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((s) => (
              <tr key={s.name} className="border-b border-border align-top">
                <td className="py-4 pr-4 font-bold">{s.name}</td>
                <td className="py-4 pr-4 text-muted-foreground">{s.role}</td>
                <td className="py-4 pr-4 text-muted-foreground">{s.location}</td>
                <td className="py-4 text-muted-foreground">{s.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Change log</h2>
      <ul>
        <li>2026-08 — Initial published list: Vercel, Neon, Upstash, Resend.</li>
      </ul>
    </LegalShell>
  );
}
