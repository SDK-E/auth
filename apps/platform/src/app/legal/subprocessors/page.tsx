import type { Metadata } from "next";
import { LegalShell } from "@/components/site/legal-shell";

export const metadata: Metadata = {
  title: "Subprocessors",
  description:
    "The subprocessors SDK Enterprises engages to operate the Auth service, the role each one plays, where they operate, and the categories of data involved.",
};

const SUBPROCESSORS = [
  {
    name: "Vercel Inc.",
    role: "Application hosting and content delivery",
    location: "United States; global edge network",
    data: "All traffic to the Service passes through its network; processing is limited to transmission, caching, and serving of encrypted requests and responses.",
  },
  {
    name: "Neon (Neon Inc.)",
    role: "Managed database provider",
    location: "Cloud region selected per deployment; EEA-capable regions available",
    data: "Tenant configuration, account records, authentication records, security and audit logs. Credentials and cryptographic keys are stored only in protected form.",
  },
  {
    name: "Upstash Inc.",
    role: "Transient storage for abuse prevention",
    location: "United States",
    data: "Short-lived technical counters used to detect abusive traffic. Retained only for the brief lifetime of the counter.",
  },
  {
    name: "Resend (Resend Technologies, Inc.)",
    role: "Transactional email delivery",
    location: "United States",
    data: "Recipient email address and delivery metadata for service emails such as sign-in codes. Message content is limited to what is strictly required.",
  },
];

export default function SubprocessorsPage() {
  return (
    <LegalShell
      title="Subprocessors"
      description="We keep this list current and publish additions before a new subprocessor processes personal data, giving our customers the opportunity to object on reasonable grounds."
      updated="August 23, 2026"
      activeHref="/legal/subprocessors"
    >
      <p>
        Each subprocessor operates under a written agreement imposing data
        protection obligations no less protective than those in our data
        processing addendum, and SDK Enterprises remains responsible to its
        customers for subprocessor performance. Objections to an announced
        addition may be raised within fourteen days of publication by writing
        to <a href="mailto:hello@sdk.enterprises">hello@sdk.enterprises</a>.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-body">
          <thead>
            <tr className="border-b-2 border-dark text-left">
              <th className="py-3 pr-4 align-bottom text-label uppercase">Subprocessor</th>
              <th className="py-3 pr-4 align-bottom text-label uppercase">Role</th>
              <th className="py-3 pr-4 align-bottom text-label uppercase">Location</th>
              <th className="py-3 align-bottom text-label uppercase">Categories of data involved</th>
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
        <li>August 2026 — Initial published list: Vercel, Neon, Upstash, Resend.</li>
      </ul>
    </LegalShell>
  );
}
