import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, classifyHost, HEADER_HOST_KIND, HEADER_TENANT_SLUG } from "@sdk-e/shared";
import { LOCALE_COOKIE, isLocale, locales, matchLocale, parseAcceptLanguage } from "@/i18n";
import { verifySignedJwt } from "@/lib/auth/verify";

const PUBLIC_PATHS = new Set(["/", "/u/login", "/u/login/verify", "/u/logout", "/security", "/sitemap.xml"]);
const PUBLIC_PREFIXES = ["/u/", "/authorize", "/oauth/", "/api/health", "/.well-known/", "/legal/"];
const NEGOTIABLE_PATH = /^\/(?:$|security$|legal\/[a-z-]+$)/;

function isPublicPath(pathname: string): boolean {
  const segments = pathname.split("/");
  const first = segments[1];
  let path = pathname;
  if (first && locales.includes(first as (typeof locales)[number])) {
    path = pathname.slice(first.length + 1) || "/";
  }
  return (
    PUBLIC_PATHS.has(path) ||
    PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
    (path !== pathname && PUBLIC_PATHS.has("/"))
  );
}

function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

export default async function proxy(request: NextRequest) {
  const hostHeader = request.headers.get("host") ?? "";
  const info = classifyHost(hostHeader);

  const headers = new Headers(request.headers);
  headers.set(HEADER_HOST_KIND, info.kind);
  if (info.kind === "tenant") {
    headers.set(HEADER_TENANT_SLUG, info.tenantSlug);
  }

  const pathname = request.nextUrl.pathname;

  if (request.method === "GET" && NEGOTIABLE_PATH.test(pathname)) {
    const cookieLocale = readCookie(request.headers.get("cookie"), LOCALE_COOKIE);
    const preferred =
      cookieLocale && isLocale(cookieLocale)
        ? cookieLocale
        : matchLocale(parseAcceptLanguage(request.headers.get("accept-language")));
    if (preferred && preferred !== "en") {
      const target = new URL(`/${preferred}${pathname === "/" ? "" : pathname}`, request.url);
      const negotiation = NextResponse.redirect(target, 307);
      negotiation.headers.set("vary", "accept-language");
      return negotiation;
    }
  }

  if (!isPublicPath(pathname)) {
    const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE_NAME);
    let authenticated = false;
    if (token) {
      try {
        await verifySignedJwt(token);
        authenticated = true;
      } catch {
        authenticated = false;
      }
    }
    if (!authenticated) {
      const loginUrl = new URL("/u/login", request.url);
      loginUrl.searchParams.set("return_to", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
