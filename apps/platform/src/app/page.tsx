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

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
        SDK Enterprises
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance">
        SDK Enterprises Auth Platform
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Multi-tenant authentication infrastructure. One domain, every plane:
        dashboard, OIDC provider, management API.
      </p>
      <ul className="mt-10 grid gap-4">
        {planes.map((plane) => (
          <li
            key={plane.title}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <h2 className="font-medium">{plane.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{plane.body}</p>
          </li>
        ))}
      </ul>
      <footer className="mt-12 text-xs text-muted-foreground">
        Milestone 1 — foundation scaffold. Service status:{" "}
        <a className="underline underline-offset-4" href="/api/health">
          /api/health
        </a>
      </footer>
    </main>
  );
}
