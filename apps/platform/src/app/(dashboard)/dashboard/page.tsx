import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getDb, users } from "@sdk-e/db";
import { loadActiveSession } from "@/lib/auth/sessions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard · SDK-E Auth" };

export default async function DashboardPage() {
  const headerList = await headers();
  const request = new Request("http://dashboard.local/", { headers: headerList });
  const auth = await loadActiveSession(request);

  const user = auth
    ? (
        await getDb().select().from(users).where(eq(users.id, auth.session.userId)).limit(1)
      )[0]
    : undefined;

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-semibold tracking-tight text-zinc-900">SDK-E Auth</span>
          <div className="flex items-center gap-4 text-sm">
            {user?.email ? <span className="text-zinc-500">{user.email}</span> : null}
            <a
              href="/u/logout"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Sign out
            </a>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Welcome{user ? `, ${user.email}` : ""}
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600">
          This session was issued by your own platform: email OTP login created a session row,
          signed an RS256 cookie JWT, and this page verified it through the same trust chain used
          by every tenant application.
        </p>
        <dl className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <dt className="text-sm font-medium text-zinc-500">Session</dt>
            <dd className="mt-1 truncate font-mono text-sm text-zinc-900">{auth?.session.id ?? "-"}</dd>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <dt className="text-sm font-medium text-zinc-500">AMR</dt>
            <dd className="mt-1 font-mono text-sm text-zinc-900">
              {(auth?.session.amr ?? []).join(", ") || "-"}
            </dd>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <dt className="text-sm font-medium text-zinc-500">Logins</dt>
            <dd className="mt-1 font-mono text-sm text-zinc-900">{user?.loginCount ?? 0}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
