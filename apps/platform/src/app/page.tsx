import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  title: "Auth — multi-tenant authentication infrastructure",
  description:
    "Auth gives your product OIDC and OAuth 2.1 out of the box — hosted login pages, session management, and a management API — so your team ships features instead of identity plumbing.",
};

const STANDARDS = ["OAuth 2.1", "OIDC", "PKCE", "JWT", "WebAuthn", "SAML"];

const FEATURES: Array<{
  status: "available" | "rolling_out";
  title: string;
  body: string;
}> = [
  {
    status: "available",
    title: "Universal login",
    body: "A hosted sign-in flow your users get redirected to — email one-time codes, no passwords to store, no login UI to maintain.",
  },
  {
    status: "available",
    title: "Session management",
    body: "Sessions are signed RS256 JWTs in http-only cookies, with idle and absolute expiry, server-side revocation, and per-environment keys.",
  },
  {
    status: "available",
    title: "Token security",
    body: "Authorization codes always travel with PKCE. Refresh tokens rotate on every use, and a replayed token revokes its whole family.",
  },
  {
    status: "available",
    title: "Audit ledger",
    body: "Every security event lands in a hash-chained audit log per environment — tampering breaks the chain, and the chain recomputes from genesis.",
  },
  {
    status: "available",
    title: "Abuse controls",
    body: "Fixed-window rate limits on code delivery, verification attempts, and token issuance. Lockouts consume outstanding codes; copy stays neutral.",
  },
  {
    status: "rolling_out",
    title: "Management API",
    body: "One API surface for applications, users, sessions, and logs at /api/v2, driven by scoped machine tokens.",
  },
];

const STEPS = [
  {
    title: "Discover our endpoints",
    body: "Your app reads standard OIDC discovery — no SDK required, any language works.",
    code: `curl https://auth.sdk.enterprises/.well-known/openid-configuration`,
  },
  {
    title: "Send users to /authorize with PKCE",
    body: "Create a code challenge, redirect the browser, we handle the hosted login and email code.",
    code: `GET https://auth.sdk.enterprises/authorize?
  response_type=code
  &client_id=client_platform_spa_prod
  &redirect_uri=https://yourapp.dev/callback
  &scope=openid email offline_access
  &code_challenge=<SHA-256(verifier)>
  &code_challenge_method=S256`,
  },
  {
    title: "Exchange the code for tokens",
    body: "Verify the id_token against our public JWKS, keep the refresh token, call userinfo when you need claims.",
    code: `POST https://auth.sdk.enterprises/oauth/token
  grant_type=authorization_code
  &code=<code>&code_verifier=<verifier>`,
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    includedMau: "1,000 monthly active users",
    features: [
      "All environments (dev, staging, production)",
      "Unlimited applications per environment",
      "Email one-time-code login",
      "Audit ledger and auth event logs",
      "Community support",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$350",
    period: "per month",
    includedMau: "10,000 monthly active users",
    features: [
      "Everything in Free",
      "Custom domains per tenant",
      "MFA, passkeys, and enterprise SSO as they ship",
      "Longer audit retention",
      "Priority support",
    ],
    cta: "Start with Pro",
    highlight: true,
  },
];

function StatusBadge({ status }: { status: "available" | "rolling_out" }) {
  if (status === "available") {
    return (
      <span className="rounded-md bg-primary px-2 py-1 text-micro uppercase font-bold text-primary-foreground">
        Available
      </span>
    );
  }
  return (
    <span className="rounded-md border border-border px-2 py-1 text-micro uppercase font-bold text-muted-foreground">
      Rolling out
    </span>
  );
}

function SectionHead(params: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-[0.65fr_1.35fr] md:gap-[50px]">
      <div>
        <p className="text-label uppercase text-muted-foreground">{params.eyebrow}</p>
        <h2 className="mt-4 text-h3 font-bold md:text-title">{params.title}</h2>
      </div>
      {params.intro ? (
        <p className="max-w-[65ch] self-end text-body text-muted-foreground md:text-lead">
          {params.intro}
        </p>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-dvh">
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-[1220px] gap-12 px-6 py-16 md:py-[84px] lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <p className="text-label uppercase text-muted-foreground">
                SDK Enterprises · Multi-tenant authentication infrastructure
              </p>
              <h1 className="mt-5 text-display font-extrabold text-balance">
                One login flow for every tenant you host.
              </h1>
              <p className="mt-6 max-w-[65ch] text-lead text-muted-foreground">
                Auth gives your product OIDC and OAuth 2.1 out of the box — hosted
                login pages, session management, and a management API — so your
                team ships features instead of identity plumbing.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="#quickstart"
                  className="rounded-md bg-primary px-[18px] py-3.5 text-label uppercase font-bold text-primary-foreground transition-opacity duration-150 hover:opacity-90"
                >
                  Start building
                </a>
                <Link
                  href="/dashboard"
                  className="rounded-md border border-foreground px-[18px] py-3.5 text-label uppercase font-bold text-foreground transition-colors duration-150 hover:bg-secondary"
                >
                  Create your tenant
                </Link>
                <Link
                  href="/security"
                  className="text-label uppercase font-bold text-foreground underline-offset-4 transition-colors duration-150 hover:text-muted-foreground hover:underline"
                >
                  Security model →
                </Link>
              </div>
            </div>
            <div aria-hidden className="hidden rounded-lg border border-border bg-card p-6 lg:block">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="rounded-md border border-border bg-background p-4">
                  <p className="text-label uppercase text-muted-foreground">Your app</p>
                  <p className="mt-2 text-body">Redirects to /authorize</p>
                </div>
                <span className="text-body text-muted-foreground">→</span>
                <div className="rounded-md bg-dark p-4">
                  <p className="text-label uppercase text-fog">auth. universal login</p>
                  <p className="mt-2 text-body text-light">Hosted email code sign-in</p>
                </div>
              </div>
              <div className="my-4 border-t border-dashed border-border" />
              <div className="rounded-md bg-dark p-4">
                <p className="text-label uppercase text-fog">Back to your app</p>
                <p className="mt-2 break-all font-mono text-micro leading-relaxed text-light/90">
                  callback?code=… → POST /oauth/token → access_token · id_token ·
                  refresh_token
                </p>
              </div>
              <p className="mt-4 text-micro uppercase text-muted-foreground">
                PKCE mandatory · tokens verified against public JWKS
              </p>
            </div>
          </div>
        </section>

        <section className="dark border-b border-border">
          <div className="mx-auto max-w-[1220px] px-6 py-14">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-label uppercase text-fog">Standards in, sessions out</p>
                <ul className="mt-5 flex flex-wrap gap-3">
                  {STANDARDS.map((s) => (
                    <li key={s} className="rounded-full border border-border bg-card px-4 py-2 text-body">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="max-w-[48ch] text-body text-fog">
                We implement the specs exactly: PKCE on every authorization code,
                rotating refresh tokens, revocable signed sessions, published
                signing keys.
              </p>
            </div>
          </div>
        </section>

        <section id="platform" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-[84px]">
            <SectionHead
              eyebrow="The platform"
              title="Identity plumbing, handled."
              intro="Everything below is live today unless marked otherwise — each card names the mechanism, because that is what you are actually buying."
            />
            <div className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article key={feature.title} className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-h3 font-bold">{feature.title}</h3>
                    <StatusBadge status={feature.status} />
                  </div>
                  <p className="mt-3 text-body text-muted-foreground">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-paper">
          <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-[84px]">
            <SectionHead
              eyebrow="Privacy first"
              title="Your tenants' data stays yours."
              intro="Auth is identity infrastructure — we process exactly what authentication requires and publish every detail. No ad trackers, no data sale, no model training on tenant data."
            />
            <div className="mt-10 grid gap-3.5 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-h3 font-bold">What we process</h3>
                <ul className="mt-4 space-y-2 text-body text-muted-foreground">
                  <li>· Account email, to deliver one-time codes</li>
                  <li>· Authentication events with technical metadata, kept for security and audit</li>
                  <li>· Transient abuse-prevention counters that expire on their own</li>
                  <li>· Credentials and cryptographic keys stored only in protected form</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-h3 font-bold">What we never do</h3>
                <ul className="mt-4 space-y-2 text-body text-muted-foreground">
                  <li>· Sell, rent, or share personal data — ever, for any purpose</li>
                  <li>· Load third-party trackers or ad pixels on auth surfaces</li>
                  <li>· Train models on tenant or end-user data</li>
                  <li>· Keep data after you close your account, beyond legal minimums</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <Link href="/legal/privacy" className="text-label uppercase font-bold text-foreground underline-offset-4 hover:underline">
                Privacy policy →
              </Link>
              <Link href="/legal/dpa" className="text-label uppercase font-bold text-foreground underline-offset-4 hover:underline">
                Data processing addendum →
              </Link>
              <Link href="/legal/subprocessors" className="text-label uppercase font-bold text-foreground underline-offset-4 hover:underline">
                Subprocessor list →
              </Link>
            </div>
          </div>
        </section>

        <section id="quickstart" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-[84px]">
            <SectionHead
              eyebrow="Quickstart"
              title="Three requests to a working login."
              intro="No proprietary protocol, no vendor lock-in — everything below is stock OAuth 2.1 and OIDC against our live endpoints."
            />
            <ol className="mt-10 space-y-10">
              {STEPS.map((step, index) => (
                <li key={step.title} className="border-t-2 border-dark pt-6">
                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                    <div>
                      <p className="text-label uppercase text-muted-foreground">Step {index + 1}</p>
                      <h3 className="mt-2 text-h3 font-bold">{step.title}</h3>
                      <p className="mt-3 max-w-[55ch] text-body text-muted-foreground">{step.body}</p>
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-dark p-5 font-mono text-micro leading-relaxed text-light">
                      <code>{step.code}</code>
                    </pre>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 border-b border-border bg-paper">
          <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-[84px]">
            <SectionHead
              eyebrow="Pricing"
              title="Priced by users, not by locks."
              intro="Early-access pricing. A monthly active user is a user who authenticated at least once that month; you are never billed for stored-but-idle accounts."
            />
            <div className="mt-10 grid gap-3.5 md:grid-cols-2 lg:max-w-[860px]">
              {PLANS.map((plan) => (
                <article
                  key={plan.name}
                  className={
                    plan.highlight
                      ? "rounded-lg border-2 border-dark bg-card p-7"
                      : "rounded-lg border border-border bg-card p-7"
                  }
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-h3 font-bold">{plan.name}</h3>
                    {plan.highlight ? (
                      <span className="rounded-md bg-primary px-2 py-1 text-micro uppercase font-bold text-primary-foreground">
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4">
                    <span className="text-title font-extrabold">{plan.price}</span>{" "}
                    <span className="text-body text-muted-foreground">{plan.period}</span>
                  </p>
                  <p className="mt-1 text-label uppercase text-muted-foreground">{plan.includedMau}</p>
                  <ul className="mt-5 space-y-2 text-body text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature}>· {feature}</li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard"
                    className={
                      plan.highlight
                        ? "mt-7 inline-block rounded-md bg-primary px-[18px] py-3.5 text-label uppercase font-bold text-primary-foreground transition-opacity duration-150 hover:opacity-90"
                        : "mt-7 inline-block rounded-md border border-foreground px-[18px] py-3.5 text-label uppercase font-bold text-foreground transition-colors duration-150 hover:bg-secondary"
                    }
                  >
                    {plan.cta}
                  </Link>
                </article>
              ))}
            </div>
            <p className="mt-6 max-w-[70ch] text-micro uppercase text-muted-foreground">
              Billing is not yet automated — early-access tenants are invoiced manually and can leave anytime.
            </p>
          </div>
        </section>

        <section className="bg-primary">
          <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-6 px-6 py-14">
            <div>
              <h2 className="text-h3 font-bold md:text-title">Your login page is one redirect away.</h2>
              <p className="mt-2 text-body text-dark/80">
                Point discovery at auth.sdk.enterprises and ship your first flow this afternoon.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-md bg-dark px-[18px] py-3.5 text-label uppercase font-bold text-light transition-opacity duration-150 hover:opacity-90"
            >
              Open the dashboard
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
