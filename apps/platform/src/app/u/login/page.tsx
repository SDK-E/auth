import type { Metadata } from "next";
import { safeReturnTo } from "@/lib/auth/login-flow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in · SDK-E Auth" };

type SearchParams = Promise<{ return_to?: string; error?: string; email?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const email = typeof params.email === "string" ? params.email : "";
  const error = typeof params.error === "string" ? params.error : undefined;
  const returnTo = safeReturnTo(params.return_to);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">
          We&apos;ll email you a one-time code. No password needed.
        </p>
        <form method="POST" action="/u/api/login/email" className="mt-6 space-y-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={email}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              placeholder="you@company.com"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/30"
          >
            Continue with code
          </button>
        </form>
      </div>
    </main>
  );
}

