import type { Metadata } from "next";
import { LegalShell } from "@/components/site/legal-shell";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms governing access to and use of the Auth authentication service provided by SDK Enterprises.",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of service"
      description="These terms form the agreement between you and SDK Enterprises for use of the Auth service. They are intentionally concise, but they cover everything that matters in a professional relationship."
      updated="August 23, 2026"
      activeHref="/legal/terms"
    >
      <h2>1. Definitions</h2>
      <ul>
        <li><strong>&quot;Service&quot;</strong> — the Auth multi-tenant authentication platform operated at auth.sdk.enterprises, including its dashboards, interfaces, and documentation.</li>
        <li><strong>&quot;Tenant&quot;</strong> — your isolated workspace within the Service.</li>
        <li><strong>&quot;End user&quot;</strong> — an individual who authenticates to your products through the Service.</li>
        <li><strong>&quot;Agreement&quot;</strong> — these terms together with any order or plan selection you make, our privacy policy, and (where applicable) our data processing addendum.</li>
      </ul>

      <h2>2. Who you are</h2>
      <p>
        You represent a legal entity or act as a professional. You confirm that
        the information you provide when registering is accurate, that you are
        authorised to bind the entity you represent, and that your use of the
        Service complies with the laws applicable to you and to your end users.
        The Service is not offered to consumers acting outside a professional
        capacity, nor to individuals below the age of digital consent.
      </p>

      <h2>3. Your tenant and responsibilities</h2>
      <ul>
        <li>You are responsible for the applications you register, the addresses you authorise for redirection, and the confidentiality of credentials issued to you. Notify us without delay of any compromise.</li>
        <li>You are responsible for your relationship with end users, including informing them of processing carried out through the Service and securing any necessary permissions.</li>
        <li>You must keep tenant contact details current so we can reach you about security and service matters.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the Service for unlawful purposes, or in a way that infringes the rights of others;</li>
        <li>interfere with, overload, probe, or test the Service outside our responsible disclosure policy;</li>
        <li>circumvent security controls, usage limits, or access restrictions;</li>
        <li>resell or white-label the Service itself as a competing hosted identity offering without a separate agreement;</li>
        <li>send unlawful content through emails delivered by the Service, or misrepresent its origin;</li>
        <li>upload malicious code or content unrelated to authentication.</li>
      </ul>
      <p>
        We may investigate suspected violations and may suspend affected access
        where reasonably necessary — with notice where practicable, and
        immediately where there is a credible security risk.
      </p>

      <h2>5. Service availability</h2>
      <p>
        We operate the Service on reputable managed infrastructure with
        monitoring, backups, and redundancy appropriate to its maturity. During
        the early-access period no formal service-level commitment applies;
        when one does, it will be published here and will form part of the
        Agreement. Planned maintenance is announced in advance where feasible.
      </p>

      <h2>6. Fees, invoicing, and taxes</h2>
      <ul>
        <li>Fees are those published on the pricing section of our site at the time you subscribe, expressed exclusive of applicable taxes.</li>
        <li>Unless stated otherwise, fees are due monthly in advance and are non-refundable once the period has started, except where required by law.</li>
        <li>We may change pricing prospectively with at least 30 days&apos; notice; changes never affect a period already paid.</li>
        <li>Late payment may result in suspension after prior written warning.</li>
      </ul>

      <h2>7. Intellectual property</h2>
      <p>
        SDK Enterprises retains all rights in the Service, including its
        software, brand assets, and documentation. You retain all rights in
        your applications and in data belonging to you and your end users. You
        receive a personal, non-exclusive, non-transferable right to use the
        Service in accordance with this Agreement for its duration. Feedback you
        offer us may be used freely to improve the Service without obligation.
      </p>

      <h2>8. Warranties and disclaimers</h2>
      <p>
        We warrant that we will provide the Service with reasonable skill and
        care. Except as expressly stated, and to the maximum extent permitted by
        law, the Service is provided &quot;as is&quot; without additional
        warranties of any kind, whether express or implied, including fitness
        for a particular purpose or uninterrupted error-free operation. Nothing
        in this Agreement excludes liability that cannot be excluded under
        French law, including liability for intent or gross negligence, bodily
        injury, and statutory consumer protections where they apply.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the extent permitted by law, neither party is liable for indirect,
        incidental, or consequential loss, including lost profits, revenue,
        goodwill, or data, however caused. Each party&apos;s total aggregate
        liability arising out of or related to the Agreement is capped at the
        total fees paid by you in the twelve months preceding the event giving
        rise to the claim. These limits apply jointly and severally to our
        subprocessors only to the extent permitted by law.
      </p>

      <h2>10. Indemnity</h2>
      <p>
        You agree to defend and indemnify us against third-party claims arising
        from your applications, your use of the Service in breach of this
        Agreement, or your infringement of third-party rights — provided we
        notify you promptly of the claim, allow you to control its defence, and
        do not settle it unilaterally on your behalf.
      </p>

      <h2>11. Confidentiality</h2>
      <p>
        Each party protects the other&apos;s confidential information with at
        least the care it applies to its own similar information, uses it solely
        to perform the Agreement, and discloses it only to personnel and advisers
        who need it and are bound by equivalent duties. This duty survives
        termination for three years.
      </p>

      <h2>12. Duration, suspension, and termination</h2>
      <ul>
        <li>The Agreement starts when you first use the Service and continues while your tenant exists.</li>
        <li>Either party may terminate at any time with written notice; fee-paid periods continue to their scheduled end unless the law provides otherwise.</li>
        <li>Either party may terminate for material breach not cured within 30 days of notice, or immediately where continued performance would be unlawful or materially harmful.</li>
        <li>On termination we make a machine-readable export of your tenant data available on request for 30 days, then delete the tenant subject to retention duties described in the privacy policy.</li>
      </ul>

      <h2>13. Third-party providers</h2>
      <p>
        The Service relies on reputable infrastructure providers listed on our
        subprocessors page. We are responsible for their performance under this
        Agreement; your relationships with them arise only through us.
      </p>

      <h2>14. Force majeure</h2>
      <p>
        Neither party is liable for failure to perform caused by events beyond
        its reasonable control — natural disasters, strikes, war, failures of
        public networks or utilities, or measures of public authorities —
        provided the affected party notifies the other and resumes performance
        as soon as reasonably possible.
      </p>

      <h2>15. General clauses</h2>
      <ul>
        <li>This Agreement is the entire understanding between the parties regarding the Service and supersedes prior arrangements.</li>
        <li>If a clause is held invalid, the remainder continues in force and the parties replace the clause with a valid one closest to its intent.</li>
        <li>A party&apos;s delay in enforcing a right is not a waiver of it.</li>
        <li>You may not assign the Agreement without our consent; we may assign it as part of a reorganisation of our business, with notice.</li>
        <li>Notices are validly given by email to hello@sdk.enterprises or to the tenant contact address last provided.</li>
        <li>These terms are drawn up in English; a French version may be provided for convenience. For contracts with French professional clients, the French version prevails where one exists and differences remain.</li>
      </ul>

      <h2>16. Governing law and disputes</h2>
      <p>
        French law governs this Agreement. Before litigating, the parties will
        attempt good-faith resolution for 30 days from written notice of a
        dispute. Failing that, the courts of Paris, France have jurisdiction —
        save where mandatory rules grant you a different forum.
      </p>

      <h2>17. Changes to these terms</h2>
      <p>
        Material changes are announced on this page at least 30 days before they
        take effect. Continued use after that date constitutes acceptance; if
        you disagree, you may terminate before the date takes effect.
      </p>
    </LegalShell>
  );
}
