import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import type { Locale } from "@/i18n";
import type { FooterStrings, HeaderStrings, StatusBadgeStrings } from "@/i18n/types";

export type HomeMessages = {
  meta: { title: string; description: string };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    primaryCta: string;
    secondaryCta: string;
    securityLink: string;
    visual: {
      appTitle: string;
      appBody: string;
      loginTitle: string;
      loginBody: string;
      returnTitle: string;
      returnBody: string;
      footnote: string;
    };
  };
  standards: { eyebrow: string; sentence: string };
  features: {
    eyebrow: string;
    title: string;
    intro: string;
    items: Array<{ status: "available" | "rolling_out"; title: string; body: string }>;
  };
  privacy: {
    eyebrow: string;
    title: string;
    intro: string;
    processedTitle: string;
    processed: string[];
    neverTitle: string;
    never: string[];
    privacyLink: string;
    dpaLink: string;
    subprocessorsLink: string;
  };
  quickstart: {
    eyebrow: string;
    title: string;
    intro: string;
    stepLabel: string;
    steps: Array<{ title: string; body: string }>;
  };
  pricing: {
    eyebrow: string;
    title: string;
    intro: string;
    perMonth: string;
    periodFree: string;
    plans: Array<{ includedMau: string; features: string[]; cta: string }>;
    note: string;
  };
  ctaBand: { title: string; body: string; button: string };
};

const STANDARDS = ["OAuth 2.1", "OIDC", "PKCE", "JWT", "WebAuthn", "SAML"];

const QUICKSTART_CODE = [
  `curl https://auth.sdk.enterprises/.well-known/openid-configuration`,
  `GET https://auth.sdk.enterprises/authorize?
  response_type=code
  &client_id=client_platform_spa_prod
  &redirect_uri=https://yourapp.dev/callback
  &scope=openid email offline_access
  &code_challenge=<SHA-256(verifier)>
  &code_challenge_method=S256`,
  `POST https://auth.sdk.enterprises/oauth/token
  grant_type=authorization_code
  &code=<code>&code_verifier=<verifier>`,
];

function StatusBadge(params: { status: "available" | "rolling_out"; t: StatusBadgeStrings }) {
  if (params.status === "available") {
    return (
      <span className="shrink-0 rounded-md bg-primary px-2 py-1 text-micro uppercase font-bold text-primary-foreground">
        {params.t.available}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-md border border-border px-2 py-1 text-micro uppercase font-bold text-muted-foreground">
      {params.t.rollingOut}
    </span>
  );
}

export function HomeView(params: {
  m: HomeMessages;
  header: HeaderStrings;
  footer: FooterStrings;
  badges: StatusBadgeStrings;
  locale: Locale;
}) {
  const base = params.locale === "en" ? "" : `/${params.locale}`;
  const plans = [
    { name: "Free", price: "$0", highlight: false },
    { name: "Pro", price: "$350", highlight: true },
  ];
  return (
    <>
      <SiteHeader t={params.header} />
      <main className="min-h-dvh">
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-[1220px] gap-12 px-6 py-16 md:py-[84px] lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <p className="text-label uppercase text-muted-foreground">{params.m.hero.eyebrow}</p>
              <h1 className="mt-5 text-display font-extrabold text-balance">{params.m.hero.title}</h1>
              <p className="mt-6 max-w-[65ch] text-lead text-muted-foreground">{params.m.hero.lead}</p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="#quickstart"
                  className="rounded-md bg-primary px-[18px] py-3.5 text-label uppercase font-bold text-primary-foreground transition-opacity duration-150 hover:opacity-90"
                >
                  {params.m.hero.primaryCta}
                </a>
                <Link
                  href="/dashboard"
                  className="rounded-md border border-foreground px-[18px] py-3.5 text-label uppercase font-bold text-foreground transition-colors duration-150 hover:bg-secondary"
                >
                  {params.m.hero.secondaryCta}
                </Link>
                <Link
                  href={`${base}/security`}
                  className="text-label uppercase font-bold text-foreground underline-offset-4 transition-colors duration-150 hover:text-muted-foreground hover:underline"
                >
                  {params.m.hero.securityLink}
                </Link>
              </div>
            </div>
            <div aria-hidden className="hidden rounded-lg border border-border bg-card p-6 lg:block">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="rounded-md border border-border bg-background p-4">
                  <p className="text-label uppercase text-muted-foreground">{params.m.hero.visual.appTitle}</p>
                  <p className="mt-2 text-body">{params.m.hero.visual.appBody}</p>
                </div>
                <span className="text-body text-muted-foreground">→</span>
                <div className="rounded-md bg-dark p-4">
                  <p className="text-label uppercase text-fog">{params.m.hero.visual.loginTitle}</p>
                  <p className="mt-2 text-body text-light">{params.m.hero.visual.loginBody}</p>
                </div>
              </div>
              <div className="my-4 border-t border-dashed border-border" />
              <div className="rounded-md bg-dark p-4">
                <p className="text-label uppercase text-fog">{params.m.hero.visual.returnTitle}</p>
                <p className="mt-2 break-all font-mono text-micro leading-relaxed text-light/90">
                  {params.m.hero.visual.returnBody}
                </p>
              </div>
              <p className="mt-4 text-micro uppercase text-muted-foreground">{params.m.hero.visual.footnote}</p>
            </div>
          </div>
        </section>

        <section className="dark border-b border-border">
          <div className="mx-auto max-w-[1220px] px-6 py-14">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-label uppercase text-fog">{params.m.standards.eyebrow}</p>
                <ul className="mt-5 flex flex-wrap gap-3">
                  {STANDARDS.map((s) => (
                    <li key={s} className="rounded-full border border-border bg-card px-4 py-2 text-body">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="max-w-[48ch] text-body text-fog">{params.m.standards.sentence}</p>
            </div>
          </div>
        </section>

        <section id="platform" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-[84px]">
            <div className="grid gap-6 md:grid-cols-[0.65fr_1.35fr] md:gap-[50px]">
              <div>
                <p className="text-label uppercase text-muted-foreground">{params.m.features.eyebrow}</p>
                <h2 className="mt-4 text-h3 font-bold md:text-title">{params.m.features.title}</h2>
              </div>
              <p className="max-w-[65ch] self-end text-body text-muted-foreground md:text-lead">
                {params.m.features.intro}
              </p>
            </div>
            <div className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {params.m.features.items.map((feature) => (
                <article key={feature.title} className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-h3 font-bold">{feature.title}</h3>
                    <StatusBadge status={feature.status} t={params.badges} />
                  </div>
                  <p className="mt-3 text-body text-muted-foreground">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-paper">
          <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-[84px]">
            <div className="grid gap-6 md:grid-cols-[0.65fr_1.35fr] md:gap-[50px]">
              <div>
                <p className="text-label uppercase text-muted-foreground">{params.m.privacy.eyebrow}</p>
                <h2 className="mt-4 text-h3 font-bold md:text-title">{params.m.privacy.title}</h2>
              </div>
              <p className="max-w-[65ch] self-end text-body text-muted-foreground md:text-lead">
                {params.m.privacy.intro}
              </p>
            </div>
            <div className="mt-10 grid gap-3.5 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-h3 font-bold">{params.m.privacy.processedTitle}</h3>
                <ul className="mt-4 space-y-2 text-body text-muted-foreground">
                  {params.m.privacy.processed.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-h3 font-bold">{params.m.privacy.neverTitle}</h3>
                <ul className="mt-4 space-y-2 text-body text-muted-foreground">
                  {params.m.privacy.never.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <Link href={`${base}/legal/privacy`} className="text-label uppercase font-bold text-foreground underline-offset-4 hover:underline">
                {params.m.privacy.privacyLink}
              </Link>
              <Link href={`${base}/legal/dpa`} className="text-label uppercase font-bold text-foreground underline-offset-4 hover:underline">
                {params.m.privacy.dpaLink}
              </Link>
              <Link href={`${base}/legal/subprocessors`} className="text-label uppercase font-bold text-foreground underline-offset-4 hover:underline">
                {params.m.privacy.subprocessorsLink}
              </Link>
            </div>
          </div>
        </section>

        <section id="quickstart" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-[84px]">
            <div className="grid gap-6 md:grid-cols-[0.65fr_1.35fr] md:gap-[50px]">
              <div>
                <p className="text-label uppercase text-muted-foreground">{params.m.quickstart.eyebrow}</p>
                <h2 className="mt-4 text-h3 font-bold md:text-title">{params.m.quickstart.title}</h2>
              </div>
              <p className="max-w-[65ch] self-end text-body text-muted-foreground md:text-lead">
                {params.m.quickstart.intro}
              </p>
            </div>
            <ol className="mt-10 space-y-10">
              {params.m.quickstart.steps.map((step, index) => (
                <li key={step.title} className="border-t-2 border-dark pt-6">
                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                    <div>
                      <p className="text-label uppercase text-muted-foreground">
                        {params.m.quickstart.stepLabel.replace("{index}", String(index + 1))}
                      </p>
                      <h3 className="mt-2 text-h3 font-bold">{step.title}</h3>
                      <p className="mt-3 max-w-[55ch] text-body text-muted-foreground">{step.body}</p>
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-dark p-5 font-mono text-micro leading-relaxed text-light">
                      <code>{QUICKSTART_CODE[index]}</code>
                    </pre>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 border-b border-border bg-paper">
          <div className="mx-auto max-w-[1220px] px-6 py-12 md:py-[84px]">
            <div className="grid gap-6 md:grid-cols-[0.65fr_1.35fr] md:gap-[50px]">
              <div>
                <p className="text-label uppercase text-muted-foreground">{params.m.pricing.eyebrow}</p>
                <h2 className="mt-4 text-h3 font-bold md:text-title">{params.m.pricing.title}</h2>
              </div>
              <p className="max-w-[65ch] self-end text-body text-muted-foreground md:text-lead">
                {params.m.pricing.intro}
              </p>
            </div>
            <div className="mt-10 grid gap-3.5 md:grid-cols-2 lg:max-w-[860px]">
              {params.m.pricing.plans.map((plan, index) => {
                const planStatic = plans[index];
                if (!planStatic) throw new Error(`missing pricing plan at index ${index}`);
                return (
                  <article
                    key={plan.cta}
                    className={
                      planStatic.highlight
                        ? "rounded-lg border-2 border-dark bg-card p-7"
                        : "rounded-lg border border-border bg-card p-7"
                    }
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-h3 font-bold">{planStatic.name}</h3>
                      {planStatic.highlight ? (
                        <span className="rounded-md bg-primary px-2 py-1 text-micro uppercase font-bold text-primary-foreground">
                          {params.badges.recommended}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4">
                      <span className="text-title font-extrabold">{planStatic.price}</span>{" "}
                      <span className="text-body text-muted-foreground">
                        {index === 0 ? params.m.pricing.periodFree : params.m.pricing.perMonth}
                      </span>
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
                        planStatic.highlight
                          ? "mt-7 inline-block rounded-md bg-primary px-[18px] py-3.5 text-label uppercase font-bold text-primary-foreground transition-opacity duration-150 hover:opacity-90"
                          : "mt-7 inline-block rounded-md border border-foreground px-[18px] py-3.5 text-label uppercase font-bold text-foreground transition-colors duration-150 hover:bg-secondary"
                      }
                    >
                      {plan.cta}
                    </Link>
                  </article>
                );
              })}
            </div>
            <p className="mt-6 max-w-[70ch] text-micro uppercase text-muted-foreground">{params.m.pricing.note}</p>
          </div>
        </section>

        <section className="bg-primary">
          <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-6 px-6 py-14">
            <div>
              <h2 className="text-h3 font-bold md:text-title">{params.m.ctaBand.title}</h2>
              <p className="mt-2 text-body text-dark/80">{params.m.ctaBand.body}</p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-md bg-dark px-[18px] py-3.5 text-label uppercase font-bold text-light transition-opacity duration-150 hover:opacity-90"
            >
              {params.m.ctaBand.button}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter t={params.footer} base={base} locale={params.locale} />
    </>
  );
}
