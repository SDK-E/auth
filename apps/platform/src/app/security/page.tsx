import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Auth secures authentication infrastructure: token architecture, key rotation, rate limiting, the hash-chained audit ledger, and how to report a vulnerability.",
};

const LAYERS = [
  {
    title: "Token architecture",
    points: [
      "Authorization codes require PKCE (S256) on every request and are single-use with short expiry.",
      "Refresh tokens rotate on every use; presenting a consumed token revokes the entire token family.",
      "Access and ID tokens are RS256 JWTs signed per environment; public keys are published at /.well-known/jwks.json.",
      "Revocation is available at /oauth/revoke for refresh tokens.",
    ],
  },
  {
    title: "Sessions",
    points: [
      "Session cookies are http-only, SameSite=Lax, secure in production, and carry signed RS256 session JWTs.",
      "Every session has both an idle timeout and an absolute expiry.",
      "Sessions are revocable server-side; logout revokes immediately.",
    ],
  },
  {
    title: "Keys & secrets",
    points: [
      "Per-environment RS256 signing keys; private keys are envelope-encrypted at rest (AES-256-GCM) and never logged.",
      "Rotation retires active keys while keeping them published so outstanding tokens verify until natural expiry.",
      "Client secrets are stored only as encrypted material; verification is constant-time compared after decryption.",
    ],
  },
  {
    title: "Abuse controls",
    points: [
      "Fixed-window rate limits: code delivery per email and per IP, verification failures per email, token issuance per client and IP.",
      "Excessive verification failures consume all outstanding one-time codes for that address.",
      "User-facing error copy stays neutral; specifics are written to server logs only.",
    ],
  },
  {
    title: "Auditability",
    points: [
      "Security events are written to a per-environment hash-chained ledger: each entry commits to its predecessor by SHA-256.",
      "The chain can be recomputed from genesis at any time; any retroactive edit breaks it.",
      "Standard auth events (logins, token issuance, reuse detection, revocation, key creation) are recorded alongside the ledger.",
    ],
  },
  {
    title: "Data handling",
    points: [
      "Tenant data lives in a Neon Postgres database in the region selected for the deployment; access requires encrypted transport.",
      "Secrets are envelope-encrypted before storage; the master key lives outside the database.",
      "No third-party trackers or ad pixels run on auth surfaces; analytics on this marketing site are cookieless and aggregated.",
    ],
  },
];

export default function SecurityPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-dvh">
        <section className="dark">
          <div className="mx-auto max-w-[1220px] px-6 py-16 md:py-[84px]">
            <p className="text-label uppercase text-fog">Trust</p>
            <h1 className="mt-5 max-w-[24ch] text-display font-extrabold md:text-title">
              Security is the mechanism list.
            </h1>
            <p className="mt-6 max-w-[65ch] text-lead text-fog">
              We do not ask you to trust marketing claims — every protection below
              names exactly how it works and where it runs. If we cannot describe
              the mechanism, we do not make the claim.
            </p>
          </div>
        </section>

        <section className="border-b border-border bg-paper">
          <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-[84px]">
            <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
              {LAYERS.map((layer) => (
                <article key={layer.title} className="rounded-lg border border-border bg-card p-6">
                  <h2 className="text-h3 font-bold">{layer.title}</h2>
                  <ul className="mt-4 space-y-2.5 text-body text-muted-foreground">
                    {layer.points.map((point) => (
                      <li key={point}>· {point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-[75ch] text-body text-muted-foreground">
              Compliance status, honestly: Auth implements controls aligned with
              SOC 2 criteria from day one, but no certification audit has been
              completed yet. We will publish results here when that changes.
            </p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto grid max-w-[1220px] gap-10 px-6 py-12 md:py-[84px] md:grid-cols-[0.65fr_1.35fr] md:gap-[50px]">
            <div>
              <p className="text-label uppercase text-muted-foreground">Responsible disclosure</p>
              <h2 className="mt-4 text-h3 font-bold md:text-title">Found a hole? Tell us.</h2>
            </div>
            <div>
              <ul className="max-w-[70ch] space-y-2.5 text-body text-muted-foreground [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4">
                <li>
                  · Email <a href="mailto:hello@sdk.enterprises">hello@sdk.enterprises</a> with{" "}
                  <span className="font-mono text-micro">[security]</span> in the subject line.
                </li>
                <li>· Include reproduction steps; we acknowledge reports within 2 business days.</li>
                <li>· Please avoid automated scanning against production and do not access data beyond what proves the issue.</li>
                <li>· Good-faith research under this policy is safe from legal action; we credit reporters unless they prefer anonymity.</li>
                <li>
                  · Machine-readable policy:{" "}
                  <a href="/.well-known/security.txt">/.well-known/security.txt</a>
                </li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-6">
                <Link href="/legal/privacy" className="text-label uppercase font-bold underline-offset-4 hover:underline">
                  Privacy policy →
                </Link>
                <Link href="/legal/dpa" className="text-label uppercase font-bold underline-offset-4 hover:underline">
                  DPA →
                </Link>
                <Link href="/legal/subprocessors" className="text-label uppercase font-bold underline-offset-4 hover:underline">
                  Subprocessors →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
