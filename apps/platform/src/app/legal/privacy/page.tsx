import type { Metadata } from "next";
import { LegalShell } from "@/components/site/legal-shell";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Auth by SDK Enterprises processes personal data: what we collect, why, for how long, with whom it is shared, and the rights you have over it.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy policy"
      description="This policy explains what personal data the Auth service processes, why it is processed, how long it is kept, who it is shared with, and the rights available to the people concerned. We have written it to be read and understood, not merely displayed."
      updated="August 23, 2026"
      activeHref="/legal/privacy"
    >
      <h2>1. Who we are</h2>
      <p>
        The Auth service (the &quot;Service&quot;) is operated by SDK Enterprises
        (SADDEK Entreprises, RCS Paris 850 513 912, whose registered office is at
        44 Rue Pasquier, 75008 Paris, France — &quot;SDK Enterprises&quot;,
        &quot;we&quot;, &quot;us&quot;). Our customers use the Service to
        authenticate their own users; this document describes how personal data
        flows through that arrangement and what each party is responsible for.
      </p>

      <h2>2. Our role depends on the situation</h2>
      <ul>
        <li>
          For visitors to this website and for individuals who open or administer
          an account with us, SDK Enterprises determines why and how personal
          data is processed and acts as a <strong>data controller</strong>.
        </li>
        <li>
          For end users who sign in to a product or service powered by Auth, our
          customer remains responsible for that processing as controller, and
          SDK Enterprises processes personal data on their documented
          instructions as a <strong>data processor</strong>, under our data
          processing addendum. If you are such an end user, your first point of
          contact is the product you were signing in to; we support them in
          answering your request without undue delay.
        </li>
      </ul>

      <h2>3. Categories of personal data we process</h2>
      <ul>
        <li><strong>Account data.</strong> Email address and basic profile elements you or your provider choose to submit; authentication timestamps and usage counters relating to your account.</li>
        <li><strong>Authentication data.</strong> Records of sign-in attempts and outcomes, issuance and revocation of tokens and sessions, and related technical metadata (including IP address, browser user-agent, and precise timestamps) retained for security, abuse prevention, and evidence purposes.</li>
        <li><strong>Security records.</strong> Tamper-evident logs of security-relevant events associated with your account or environment.</li>
        <li><strong>Abuse-prevention data.</strong> Short-lived technical counters used to detect and throttle abusive traffic.</li>
        <li><strong>Communications data.</strong> The content of messages you send us (for example requests for support or the exercise of rights) and our replies.</li>
        <li><strong>Commercial data.</strong> Invoicing and payment references where a paid plan applies, handled through our invoicing process.</li>
      </ul>
      <p>
        We do not require or store passwords for sign-in to the Service.
        Sensitive categories of personal data (health, biometrics, political
        opinions, and similar) are not requested and must not be submitted to us.
      </p>

      <h2>4. Purposes and legal bases</h2>
      <ul>
        <li>Operating and providing the Service — performance of a contract, or steps prior to entering into one.</li>
        <li>Securing accounts, detecting fraud and abuse, and keeping security records — our legitimate interest in operating trustworthy infrastructure, balanced against your rights and expectations.</li>
        <li>Meeting accounting, tax, and other statutory duties — compliance with a legal obligation.</li>
        <li>Sending service communications relating to your account or incidents affecting it — performance of the contract; we do not send marketing email absent separate consent.</li>
      </ul>
      <p>
        Where processing relies on consent, you may withdraw it at any time
        without affecting the lawfulness of processing carried out before
        withdrawal. We do not carry out automated decision-making producing
        legal effects within the meaning of applicable law.
      </p>

      <h2>5. Retention</h2>
      <p>
        Personal data is kept only as long as necessary for the purposes set out
        above. Account data is kept while an account or tenant remains active;
        security and audit records are kept while needed to evidence the
        integrity of the Service and meet legal requirements; abuse-prevention
        data is transient by design; commercial records are kept for the
        statutorily required bookkeeping periods. Data that is no longer needed
        is deleted or irreversibly anonymised.
      </p>

      <h2>6. Recipients and subprocessors</h2>
      <p>
        We share personal data only with: processors acting under contract on
        our behalf (hosting, database, cache, and email-delivery providers —
        identified individually on our subprocessors page); professional advisers
        under duties of confidentiality; and public authorities where a binding
        legal request requires it, in which case we notify those concerned
        unless legally prohibited. We never sell, rent, or broker personal data,
        and we do not use customer or end-user data for advertising or for
        training machine-learning models.
      </p>

      <h2>7. International transfers</h2>
      <p>
        Some of our providers operate outside the European Economic Area. Where
        personal data is transferred out of the EEA, we rely on an adequate
        adequacy decision or on appropriate safeguards — in particular the
        European Commission&apos;s standard contractual clauses — together with
        supplementary measures where required. The current list of providers and
        their locations is published on our subprocessors page.
      </p>

      <h2>8. Security of processing</h2>
      <p>
        We apply appropriate technical and organisational measures against
        unauthorised access, loss, alteration, or disclosure — including
        encryption in transit and at rest, strict access controls on a
        need-to-know basis, segregation of tenant data, rate limiting and abuse
        detection, and tamper-evident audit logging. Measures are reviewed as
        the Service evolves; a plain-language overview is available on our
        security page.
      </p>

      <h2>9. Your rights</h2>
      <p>
        Subject to applicable law, including the General Data Protection
        Regulation if you are in the EEA, you may ask us to:
      </p>
      <ul>
        <li>give you access to the personal data we hold about you;</li>
        <li>rectify inaccurate data or complete incomplete data;</li>
        <li>erase data that is no longer lawfully processed;</li>
        <li>restrict or object to particular processing;</li>
        <li>provide your data in a structured, commonly used, portable format;</li>
        <li>tell you about the recipients of your data and the safeguards applied.</li>
      </ul>
      <p>
        Write to{" "}
        <a href="mailto:hello@sdk.enterprises">hello@sdk.enterprises</a>. We
        respond within one month of a substantiated request and may ask for
        minimal proof of identity where necessary. You may also lodge a
        complaint with a supervisory authority — in France, the Commission
        Nationale de l&apos;Informatique et des Libertés (CNIL).
      </p>

      <h2>10. Children</h2>
      <p>
        The Service is directed at businesses and professionals. We do not
        knowingly process the personal data of children below the age of digital
        consent in the relevant jurisdiction; if you believe this has happened,
        contact us and we will delete the data promptly.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We update this policy when our processing changes. Material changes are
        announced on this page, with a new effective date, before they take
        effect. Earlier versions are available on request.
      </p>

      <h2>12. Contact</h2>
      <p>
        SDK Enterprises — 44 Rue Pasquier, 75008 Paris, France —{" "}
        <a href="mailto:hello@sdk.enterprises">hello@sdk.enterprises</a>.
      </p>
    </LegalShell>
  );
}
