import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Check your email" };

type SearchParams = Promise<{ email?: string; return_to?: string; error?: string }>;

export default async function VerifyPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const error = typeof params.error === "string" ? params.error : undefined;
  const returnTo = typeof params.return_to === "string" ? params.return_to : "/dashboard";

  if (!email) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-body text-muted-foreground">
            We need an email address to continue.
          </p>
          <a
            href="/u/login"
            className="mt-5 inline-block text-label uppercase font-bold text-foreground underline underline-offset-4"
          >
            Back to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <Image src="/brand/auth-mark-light.svg" alt="auth." width={40} height={40} unoptimized className="h-10 w-auto" />
      <div className="mt-8 w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <h1 className="text-h3 font-bold">Check your email</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Enter the 6-digit code we sent to{" "}
          <span className="font-bold text-foreground">{email}</span>.
        </p>
        <form method="POST" action="/u/api/login/verify" className="mt-6 space-y-4">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="return_to" value={returnTo} />
          <div>
            <label
              htmlFor="code"
              className="block text-label uppercase text-muted-foreground"
            >
              Verification code
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
              autoFocus
              required
              maxLength={6}
              placeholder="000000"
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-center text-lead font-bold tracking-[0.4em] outline-none transition-colors duration-150 placeholder:text-muted-foreground/40 focus:border-ring"
            />
          </div>
          {error ? <p className="text-body text-destructive">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-3 py-2.5 text-label uppercase font-bold text-primary-foreground transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Verify and continue
          </button>
        </form>
      </div>
      <p className="mt-6 text-micro uppercase text-muted-foreground">
        Wrong address?{" "}
        <a
          href={`/u/login?return_to=${encodeURIComponent(returnTo)}`}
          className="underline underline-offset-4 normal-case"
        >
          Use a different email
        </a>
      </p>
    </main>
  );
}
