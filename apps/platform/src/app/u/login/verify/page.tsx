import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Check your email · SDK-E Auth" };

type SearchParams = Promise<{ email?: string; return_to?: string; error?: string; sent?: string }>;

export default async function VerifyPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const error = typeof params.error === "string" ? params.error : undefined;
  const returnTo = typeof params.return_to === "string" ? params.return_to : "/dashboard";

  if (!email) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-zinc-600">Missing email. Start again.</p>
          <a href="/u/login" className="mt-4 inline-block text-sm font-medium text-zinc-900 underline">
            Back to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Check your email</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter the 6-digit code we sent to <span className="font-medium text-zinc-700">{email}</span>.
        </p>
        <form method="POST" action="/u/api/login/verify" className="mt-6 space-y-4">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="return_to" value={returnTo} />
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-zinc-700">
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
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-center text-lg tracking-[0.4em] outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              placeholder="000000"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/30"
          >
            Verify and continue
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-zinc-400">
          Wrong address?{" "}
          <a href={`/u/login?return_to=${encodeURIComponent(returnTo)}`} className="underline">
            Use a different email
          </a>
        </p>
      </div>
    </main>
  );
}
