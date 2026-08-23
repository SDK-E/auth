export const HEADER_HOST = "x-sdk-e-host";
export const HEADER_HOST_KIND = "x-sdk-e-host-kind";
export const HEADER_TENANT_SLUG = "x-sdk-e-tenant-slug";

export type HostKind = "base" | "tenant" | "custom" | "local";

export type HostInfo =
  | { kind: "base"; hostname: string }
  | { kind: "local"; hostname: string }
  | { kind: "tenant"; tenantSlug: string; hostname: string }
  | { kind: "custom"; hostname: string };

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1", "lvh.me"]);

export function classifyHost(hostHeader: string, baseDomain?: string): HostInfo {
  const hostname = normalizeHostname(hostHeader);
  const base = normalizeHostname(baseDomain ?? "auth.sdk.enterprises");

  if (LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost") || hostname.endsWith(".lvh.me")) {
    return { kind: "local", hostname };
  }

  if (hostname === base || hostname === `www.${base}`) {
    return { kind: "base", hostname };
  }

  if (hostname.endsWith(`.${base}`)) {
    const slug = hostname.slice(0, -(base.length + 1));
    const firstLabel = slug.split(".")[0] ?? slug;
    return { kind: "tenant", tenantSlug: firstLabel, hostname };
  }

  return { kind: "custom", hostname };
}

export function normalizeHostname(hostHeader: string): string {
  const withScheme = hostHeader.includes("://") ? hostHeader : `http://${hostHeader}`;
  try {
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return hostHeader.toLowerCase().split(":")[0] ?? hostHeader.toLowerCase();
  }
}
