import type { Metadata } from "next";
import { LegalShell } from "@/components/site/legal-shell";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Auth by SDK Enterprises processes personal data: what we collect, why, for how long, and the rights you have over it.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy policy"
      description="This policy explains what personal data Auth processes, why we process it, how long we keep it, and what you can do about it. It is written to be read, not skimmed past."
      updated="August 23, 2026"
      activeHref="/legal/privacy"
    >
      <h2>1. Who is responsible</h2>
      <p>
        SDK Enterprises (SADDEK Entreprises, RCS Paris 850 513 912, 44 Rue
        Pasquier, 75008 Paris, France — &quot;we&quot;) operates the Auth service at
        auth.sdk.enterprises.
      </p>
      <p>
        Our role depends on whose data is in question. For visitors of this
        marketing site and for administrators who open an Auth tenant account, we
        are the <strong>controller</strong>. For end users who sign in to a
        product powered by Auth, our customer (the tenant) is the controller and
        we act as their <strong>processor</strong>; that relationship is governed
        by our data processing addendum. End-user requests are best sent to the
        product you were signing in to — we will assist them promptly either way.
      </p>

      <h2>2. What we process</h2>
      <ul>
        <li><strong>Account data</strong> — email address, sign-in timestamps, login counts.</li>
        <li><strong>Authentication events</strong> — logins, token issuance, refresh rotation and reuse detection, revocations, key creation; recorded with IP address and user-agent for security and audit purposes.</li>
        <li><strong>Audit ledger entries</strong> — hash-chained records of the events above, per environment.</li>
        <li><strong>Rate-limit counters</strong> — numeric counters keyed by email or IP address in Redis, auto-expiring within at most one hour.</li>
        <li><strong>Email delivery metadata</strong> — recipient address and delivery outcome when we send one-time codes through our email provider.</li>
        <li><strong>Tenant configuration</strong> — application definitions, redirect URIs, client secrets stored only as encrypted material.</li>
      </ul>
      <p>
        We never store passwords — there are none. Sign-in uses one-time codes
        delivered by email, consumed at first use.
      </p>

      <h2>3. Why we process it (legal bases)</h2>
      <ul>
        <li>To provide the authentication service you or your provider asked for — <strong>contract performance</strong>.</li>
        <li>To detect abuse, enforce rate limits, and maintain a tamper-evident audit trail — <strong>legitimate interest</strong> in operating secure infrastructure.</li>
        <li>To meet accounting and legal obligations — <strong>legal obligation</strong>.</li>
      </ul>
      <p>We do not process personal data for advertising, profiling, or model training, and we never sell it.</p>

      <h2>4. How long we keep it</h2>
      <ul>
        <li>One-time codes: until used or expired (15 minutes maximum).</li>
        <li>Rate-limit counters: at most 1 hour after the last request in their window.</li>
        <li>Sessions and tokens: per configured lifetimes (idle and absolute expiry).</li>
        <li>Auth events and audit ledger: retained while your tenant exists; environment audit chains are kept as historical evidence.</li>
        <li>Tenant accounts: deleted on request after account closure, minus any records we must keep under French law.</li>
      </ul>

      <h2>5. Where the data lives and who helps us</h2>
      <p>
        Data is stored in managed infrastructure operated by our subprocessors —
        currently Vercel (hosting), Neon (Postgres databases), Upstash
        (rate-limit storage), and Resend (transactional email). Each one&apos;s role,
        location, and the data involved is listed on our subprocessors page.
        Where personal data leaves the EEA, transfers rely on appropriate
        safeguards such as the European Commission&apos;s standard contractual
        clauses.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Subject to applicable law (including the GDPR if you are in the EEA),
        you can ask to access, correct, export, or delete your personal data,
        restrict or object to processing, and withdraw consent where relevant.
        Write to <a href="mailto:hello@sdk.enterprises">hello@sdk.enterprises</a>;
        we answer within 30 days. If you are in France you may also lodge a
        complaint with the CNIL.
      </p>

      <h2>7. Security</h2>
      <p>
        Secrets and private keys are envelope-encrypted at rest; transport is
        encrypted; access tokens are short-lived; the audit ledger is
        tamper-evident by construction. The full mechanism list lives on our
        security page.
      </p>

      <h2>8. Changes</h2>
      <p>
        Material changes to this policy will be announced on this page with a new
        effective date before they take effect.
      </p>
    </LegalShell>
  );
}
