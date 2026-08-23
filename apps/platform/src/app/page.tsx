import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth — multi-tenant authentication infrastructure",
  description:
    "Auth gives your product OIDC and OAuth 2.1 out of the box — hosted login pages, session management, and a management API — so your team ships features instead of identity plumbing.",
};

const planes = [
  {
    title: "Control plane",
    body: "Tenant dashboard for applications, connections, users, branding, logs, and the security center.",
  },
  {
    title: "Auth plane",
    body: "OIDC / OAuth 2.1 provider with universal login, MFA, passkeys, and enterprise SSO.",
  },
  {
    title: "Data plane",
    body: "Management API at /api/v2 with scoped machine tokens, webhooks, and custom Actions.",
  },
];

const standards = ["OAuth 2.1", "OIDC", "PKCE", "JWT", "WebAuthn", "SAML"];

const primaryButton =
  "rounded-md bg-primary px-4 py-2 text-label uppercase font-bold text-primary-foreground transition-opacity duration-150 hover:opacity-90";

export default function HomePage() {
  return (
    <main className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1220px] items-center justify-between px-6">
          <Link
            href="/"
            aria-label="auth. home"
            className="flex items-center transition-opacity duration-150 hover:opacity-90"
          >
            <Image
              src="/brand/auth-wordmark-light.svg"
              alt="auth."
              width={140}
              height={28}
              priority
              unoptimized
              className="h-7 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-6">
            <a
              href="/api/health"
              className="text-label uppercase text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Status
            </a>
            <Link href="/dashboard" className={primaryButton}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-[1220px] gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-label uppercase text-muted-foreground">
              SDK Enterprises · Authentication infrastructure
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
                href="/dashboard"
                className="rounded-md bg-primary px-5 py-3 text-label uppercase font-bold text-primary-foreground transition-opacity duration-150 hover:opacity-90"
              >
                Open the dashboard
              </a>
              <a
                href="/u/login"
                className="rounded-md border border-input px-5 py-3 text-label uppercase text-foreground transition-colors duration-150 hover:bg-secondary"
              >
                Try universal login
              </a>
            </div>
          </div>
          <div
            aria-hidden
            className="hidden h-80 rounded-lg border border-border bg-card bg-repeat lg:block"
            style={{
              backgroundImage: "url('/brand/pattern-on-light.svg')",
              backgroundSize: "240px 240px",
            }}
          />
        </div>
      </section>

      <section className="dark border-b border-border">
        <div className="mx-auto max-w-[1220px] px-6 py-16">
          <p className="text-label uppercase text-muted-foreground">
            Standards in, sessions out
          </p>
          <ul className="mt-6 flex flex-wrap gap-3">
            {standards.map((s) => (
              <li
                key={s}
                className="rounded-full border border-border bg-card px-4 py-2 text-body"
              >
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-[65ch] text-body text-muted-foreground">
            Authorization codes always travel with PKCE. Refresh tokens rotate on
            every use, and a replayed token revokes its whole family. Sessions are
            signed and revocable.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1220px] px-6 py-20">
          <h2 className="text-title font-bold text-balance">
            One platform, three planes.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {planes.map((plane) => (
              <article
                key={plane.title}
                className="rounded-lg border border-border bg-card p-6"
              >
                <h3 className="text-h3 font-bold">{plane.title}</h3>
                <p className="mt-3 text-body text-muted-foreground">{plane.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-3 px-6 py-8 text-micro uppercase text-muted-foreground">
          <span>© {new Date().getFullYear()} SDK Enterprises</span>
          <span className="normal-case">
            auth.sdk.enterprises ·{" "}
            <a href="/api/health" className="underline underline-offset-4">
              service status
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
