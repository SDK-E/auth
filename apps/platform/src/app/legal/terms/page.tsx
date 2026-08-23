import type { Metadata } from "next";
import { LegalShell } from "@/components/site/legal-shell";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms governing use of the Auth authentication service by SDK Enterprises.",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of service"
      description="These terms govern your use of the Auth service at auth.sdk.enterprises. They are deliberately short and readable."
      updated="August 23, 2026"
      activeHref="/legal/terms"
    >
      <h2>1. The agreement</h2>
      <p>
        These terms are a contract between you (or the entity you represent) and
        SDK Enterprises — SADDEK Entreprises, RCS Paris 850 513 912, 44 Rue
        Pasquier, 75008 Paris, France — for use of the Auth multi-tenant
        authentication service. By creating a tenant or using the service you
        accept them.
      </p>

      <h2>2. Your tenant</h2>
      <ul>
        <li>You are responsible for the applications you register, the redirect URIs you allow, and the secrecy of client credentials we issue to you.</li>
        <li>You are responsible for your relationship with your own end users, including providing them any notices and lawful basis their sign-in requires.</li>
        <li>One legal entity per tenant; environments within it (development, staging, production) share that entity&apos;s terms.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You must not:</p>
      <ul>
        <li>use the service to authenticate unlawful activity or to harm the service, other tenants, or any person;</li>
        <li>probe, scan, or stress-test the service outside our responsible disclosure policy;</li>
        <li>resell the service as-is to third parties as a competing hosted identity product;</li>
        <li>misrepresent the origin of emails sent through our infrastructure.</li>
      </ul>
      <p>We may suspend a tenant that breaks these rules, with notice where practical.</p>

      <h2>4. Availability</h2>
      <p>
        Auth is in early access. We run it on managed infrastructure with health
        monitoring and publish status at /api/health, but no service-level
        agreement applies during this period. Do not route production traffic
        you cannot afford to lose before an SLA exists; when it does, its terms
        will be published here.
      </p>

      <h2>5. Pricing & billing</h2>
      <p>
        Early-access pricing is published on the landing page. Billing is
        invoiced manually until automated billing ships; you may cancel at any
        time and will not be billed after the end of the current period.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        We keep all rights in the Auth service itself. You keep all rights in
        your applications and your tenants&apos; data. You get a right to use the
        service according to these terms, nothing more.
      </p>

      <h2>7. Ending the service</h2>
      <p>
        Either side can end this agreement with written notice. On termination
        we provide a machine-readable export of your tenant data on request and
        delete the tenant afterwards, subject to section 4 of the privacy policy
        (legal minimums and audit evidence).
      </p>

      <h2>8. Liability</h2>
      <p>
        The service is provided &quot;as is&quot; during early access. To the maximum
        extent permitted by law, our total liability arising from the service is
        limited to the amounts you paid us in the twelve months before the
        claim. Nothing limits liability for intent, gross negligence, bodily
        injury, or anything else that cannot be limited under French law.
      </p>

      <h2>9. Law and venue</h2>
      <p>
        French law governs these terms. Disputes fall under the jurisdiction of
        the courts of Paris, France, except where mandatory consumer-protection
        rules give you a different forum.
      </p>

      <h2>10. Changes</h2>
      <p>
        If we change these terms materially, we announce it on this page at
        least 30 days before it takes effect. Continued use after that date
        accepts the change.
      </p>
    </LegalShell>
  );
}
