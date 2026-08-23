import type { Metadata } from "next";
import { LegalShell } from "@/components/site/legal-shell";

export const metadata: Metadata = {
  title: "Legal notice",
  description:
    "Publisher, host, and legal information for auth.sdk.enterprises (mentions légales).",
};

export default function LegalNoticePage() {
  return (
    <LegalShell
      title="Legal notice"
      description="Information required by French law for the site published at auth.sdk.enterprises (mentions légales), established in accordance with Article 6-III of Law No. 2004-575 of 21 June 2004 (LCEN)."
      updated="August 23, 2026"
      activeHref="/legal/legal-notice"
    >
      <h2>Publisher</h2>
      <p>
        This site and the Auth service are published by <strong>SADDEK
        Entreprises</strong>, trading as <strong>SDK Enterprises</strong>.
      </p>
      <ul>
        <li>SIREN: 850 513 912</li>
        <li>SIRET: 850 513 912 00020</li>
        <li>Registered office: 44 Rue Pasquier, 75008 Paris, France</li>
        <li>Legal form: auto-entrepreneur (sole trader), no share capital</li>
        <li>Company registration: RCS Paris 850 513 912</li>
        <li>Publication director: Hicham SADDEK</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions about this site or the service may be sent to{" "}
        <a href="mailto:hello@sdk.enterprises">hello@sdk.enterprises</a>. For
        security reports, see our responsible disclosure policy.
      </p>

      <h2>Hosting</h2>
      <p>
        The site and service are hosted by Vercel Inc., 440 N Barranca Ave #4133,
        Covina, CA 91723, United States. Application databases are operated by
        Neon; details of all infrastructure providers are listed on the
        subprocessors page.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The structure, texts, logos, and content of this site are the property
        of SDK Enterprises. Any reproduction or representation, in whole or in
        part, without prior authorisation is prohibited except as permitted by
        applicable law.
      </p>

      <h2>Legal framework</h2>
      <p>
        These notices are governed by French law. The Auth service is provided
        under our terms of service, and personal data handling is described in
        our privacy policy and data processing addendum.
      </p>
    </LegalShell>
  );
}
