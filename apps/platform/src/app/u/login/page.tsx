import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

type SearchParams = Promise<{ return_to?: string; error?: string; email?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const email = typeof params.email === "string" ? params.email : "";
  const error = typeof params.error === "string" ? params.error : undefined;
  const returnTo = safeReturnTo(params.return_to);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <Image src="/brand/auth-mark-light.svg" alt="auth." width={40} height={40} unoptimized className="h-10 w-auto" />
      <div className="mt-8 w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <h1 className="text-h3 font-bold">Sign in</h1>
        <p className="mt-2 text-body text-muted-foreground">
          We&apos;ll email you a one-time code. No password needed.
        </p>
        <form method="POST" action="/u/api/login/email" className="mt-6 space-y-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <div>
            <label
              htmlFor="email"
              className="block text-label uppercase text-muted-foreground"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={email}
              placeholder="you@company.com"
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-body outline-none transition-colors duration-150 placeholder:text-muted-foreground/60 focus:border-ring"
            />
          </div>
          {error ? <p className="text-body text-destructive">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-3 py-2.5 text-label uppercase font-bold text-primary-foreground transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Continue with code
          </button>
        </form>
      </div>
      <p className="mt-6 text-micro uppercase text-muted-foreground">
        Secured by auth.
      </p>
    </main>
  );
}

function safeReturnTo(value: string | undefined | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/oauth") || value.startsWith("/u/")) return "/dashboard";
  return value;
}
