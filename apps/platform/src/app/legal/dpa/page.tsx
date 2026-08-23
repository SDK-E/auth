import type { Metadata } from "next";
import { LegalShell } from "@/components/site/legal-shell";

export const metadata: Metadata = {
  title: "Data processing addendum",
  description:
    "The DPA under which SDK Enterprises processes end-user personal data on behalf of Auth tenants.",
};

export default function DpaPage() {
  return (
    <LegalShell
      title="Data processing addendum"
      description="This addendum governs SDK Enterprises' processing of personal data on behalf of tenants who use Auth to authenticate their own users. It incorporates the European Commission's standard contractual clauses where transfers require them."
      updated="August 23, 2026"
      activeHref="/legal/dpa"
    >
      <h2>1. Roles and scope</h2>
      <p>
        You (the tenant) are the controller of your end users&apos; personal data.
        SDK Enterprises (&quot;processor&quot;) processes that data solely to provide
        the Auth service: delivering one-time codes, authenticating sign-ins,
        issuing and rotating tokens, maintaining sessions, enforcing abuse
        controls, and writing audit records. This addendum forms part of the
        terms of service.
      </p>

      <h2>2. Documented instructions</h2>
      <p>
        Your instructions to us are: process end-user account emails,
        authentication event records (including IP addresses), rate-limit
        counters, and audit ledger entries, for the sole purpose of operating
        the authentication service. We will inform you if an instruction
        infringes data protection law. Any additional processing requires a
        documented agreement between us.
      </p>

      <h2>3. Confidentiality and people</h2>
      <p>
        Our personnel access personal data only as needed to operate the
        service, under confidentiality obligations that survive termination.
      </p>

      <h2>4. Security measures</h2>
      <ul>
        <li>TLS-encrypted transport for all authentication traffic.</li>
        <li>AES-256-GCM envelope encryption for client secrets and signing keys at rest; master key stored outside the database.</li>
        <li>Short-lived tokens; PKCE-mandatory authorization codes; refresh token rotation with family revocation.</li>
        <li>Fixed-window rate limiting per email, IP, and client.</li>
        <li>Per-environment SHA-256 hash-chained audit ledger, recomputable from genesis.</li>
      </ul>
      <p>The full mechanism list is published at /security and kept current.</p>

      <h2>5. Subprocessors</h2>
      <p>
        We engage the subprocessors listed at /legal/subprocessors under written
        agreements imposing data-protection obligations no less protective than
        this addendum, and we remain responsible for their performance. We give
        at least 14 days&apos; notice of new subprocessors by updating that page;
        you may object on legitimate grounds within that window, and the parties
        will work in good faith to resolve the objection — failing which you may
        terminate the affected service.
      </p>

      <h2>6. Data subject requests</h2>
      <p>
        We assist you in answering access, correction, deletion, export, and
        objection requests from your end users without undue delay, using the
        management tooling available for your tenant.
      </p>

      <h2>7. Personal data breaches</h2>
      <p>
        We notify you without undue delay, and no later than 72 hours after
        becoming aware of a personal data breach affecting your tenant data,
        with the information reasonably required for your own notification
        duties. Our security contact is hello@sdk.enterprises.
      </p>

      <h2>8. Transfers</h2>
      <p>
        Where processing takes place outside the EEA or involves transfer from
        the EEA, it relies on appropriate safeguards — including the standard
        contractual clauses adopted by the European Commission, incorporated
        here by reference with you as exporter and us (or the relevant
        subprocessor) as importer. The subprocessor page lists each
        processor&apos;s location.
      </p>

      <h2>9. Audits</h2>
      <p>
        On reasonable request, and at most once per year except after a breach,
        we provide the information needed to demonstrate compliance with this
        addendum — mechanism documentation, audit-chain verification results,
        and summaries of our own reviews.
      </p>

      <h2>10. Deletion</h2>
      <p>
        On termination of your tenant we delete or return end-user personal
        data on request, subject to retention of audit evidence required by law,
        which remains protected under this addendum&apos;s terms.
      </p>

      <h2>11. California (CCPA/CPRA)</h2>
      <p>
        For personal data subject to California law we act as a service
        provider: we do not sell or share personal data, do not retain, use, or
        disclose it outside the direct business relationship, and do not combine
        it with personal data received from other sources, except as permitted
        by law.
      </p>
    </LegalShell>
  );
}
