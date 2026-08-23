import Link from "next/link";
import Image from "next/image";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getDb, users } from "@sdk-e/db";
import { loadActiveSession } from "@/lib/auth/sessions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

const statCard = "rounded-lg border border-border bg-card p-5";

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
          <div className="flex items-center gap-4">
            {user?.email ? (
              <span className="text-body text-muted-foreground">{user.email}</span>
            ) : null}
            <Link
              href="/u/logout"
              className="rounded-md border border-input px-3 py-2 text-label uppercase text-foreground transition-colors duration-150 hover:bg-secondary"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1220px] px-6 py-16">
        <p className="text-label uppercase text-muted-foreground">Session</p>
        <h1 className="mt-3 text-h1 font-bold text-balance">
          Welcome{user ? `, ${user.email}` : ""}
        </h1>
        <p className="mt-4 max-w-[65ch] text-body text-muted-foreground">
          This session was issued by your own platform: the email code created a
          session row, signed an RS256 cookie JWT, and this page verified it
          through the same trust chain every tenant application uses.
        </p>
        <dl className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={statCard}>
            <dt className="text-label uppercase text-muted-foreground">Session</dt>
            <dd className="mt-2 truncate font-bold">{auth?.session.id ?? "—"}</dd>
          </div>
          <div className={statCard}>
            <dt className="text-label uppercase text-muted-foreground">Method</dt>
            <dd className="mt-2 font-bold">
              {(auth?.session.amr ?? []).join(", ") || "—"}
            </dd>
          </div>
          <div className={statCard}>
            <dt className="text-label uppercase text-muted-foreground">Logins</dt>
            <dd className="mt-2 font-bold">{user?.loginCount ?? 0}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
