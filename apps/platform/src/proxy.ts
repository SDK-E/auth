import { NextResponse, type NextRequest } from "next/server";
import { classifyHost, HEADER_HOST_KIND, HEADER_TENANT_SLUG } from "@sdk-e/shared";

export default function proxy(request: NextRequest) {
  const hostHeader = request.headers.get("host") ?? "";
  const info = classifyHost(hostHeader);

  const headers = new Headers(request.headers);
  headers.set(HEADER_HOST_KIND, info.kind);
  if (info.kind === "tenant") {
    headers.set(HEADER_TENANT_SLUG, info.tenantSlug);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
