import { describe, expect, it } from "vitest";
import {
  authorizeQuerySchema,
  buildDiscoveryMetadata,
  SCOPE_REGEX,
  splitScope,
  tokenRequestSchema,
} from "./oidc.ts";

const validQuery = {
  response_type: "code",
  client_id: "client_abc",
  redirect_uri: "https://app.example/callback",
  code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
};

describe("authorizeQuerySchema", () => {
  it("accepts a minimal PKCE query with defaults applied", () => {
    const parsed = authorizeQuerySchema.parse(validQuery);
    expect(parsed.scope).toBe("openid");
    expect(parsed.code_challenge_method).toBe("S256");
    expect(parsed.state).toBeUndefined();
    expect(parsed.nonce).toBeUndefined();
  });

  it("keeps explicit state, nonce and scope", () => {
    const parsed = authorizeQuerySchema.parse({
      ...validQuery,
      scope: "openid email profile",
      state: "st_123",
      nonce: "n_abc",
      prompt: "login",
    });
    expect(parsed.scope).toBe("openid email profile");
    expect(parsed.state).toBe("st_123");
    expect(parsed.nonce).toBe("n_abc");
    expect(parsed.prompt).toBe("login");
  });

  it("rejects implicit flow", () => {
    expect(() =>
      authorizeQuerySchema.parse({ ...validQuery, response_type: "token" }),
    ).toThrow();
  });

  it("rejects missing or short code challenges", () => {
    expect(() =>
      authorizeQuerySchema.parse({ ...validQuery, code_challenge: undefined }),
    ).toThrow();
    expect(() =>
      authorizeQuerySchema.parse({ ...validQuery, code_challenge: "too-short" }),
    ).toThrow();
  });

  it("rejects challenge methods other than S256", () => {
    expect(() =>
      authorizeQuerySchema.parse({ ...validQuery, code_challenge_method: "plain" }),
    ).toThrow();
  });

  it("rejects missing client identification", () => {
    expect(() => authorizeQuerySchema.parse({ ...validQuery, client_id: "" })).toThrow();
    expect(() => authorizeQuerySchema.parse({ ...validQuery, redirect_uri: "" })).toThrow();
  });
});

describe("tokenRequestSchema", () => {
  it("accepts both supported grant types with optional fields", () => {
    expect(
      tokenRequestSchema.parse({
        grant_type: "authorization_code",
        code: "acode_1",
        redirect_uri: "https://app.example/callback",
        client_id: "client_abc",
        code_verifier: "v".repeat(64),
      }).grant_type,
    ).toBe("authorization_code");

    expect(
      tokenRequestSchema.parse({ grant_type: "refresh_token", refresh_token: "rtk_1" })
        .grant_type,
    ).toBe("refresh_token");
  });

  it("rejects unsupported grant types", () => {
    expect(() => tokenRequestSchema.parse({ grant_type: "password" })).toThrow();
    expect(() => tokenRequestSchema.parse({ grant_type: "client_credentials" })).toThrow();
    expect(() => tokenRequestSchema.parse({})).toThrow();
  });
});

describe("splitScope", () => {
  it("splits on whitespace and deduplicates", () => {
    expect(splitScope("openid openid email")).toEqual(["openid", "email"]);
    expect(splitScope("  openid\tprofile\nemail ")).toEqual(["openid", "profile", "email"]);
  });

  it("returns empty for blank input", () => {
    expect(splitScope("")).toEqual([]);
    expect(splitScope("   ")).toEqual([]);
  });
});

describe("SCOPE_REGEX", () => {
  it("admits tokens, colons, slashes and digits", () => {
    for (const scope of ["openid", "read:users", "api/v2", "offline_access"]) {
      expect(SCOPE_REGEX.test(scope)).toBe(true);
    }
  });

  it("rejects spaces, uppercase and specials", () => {
    for (const scope of ["open id", "OpenID", "email;profile", "a=b"]) {
      expect(SCOPE_REGEX.test(scope)).toBe(false);
    }
  });
});

describe("buildDiscoveryMetadata", () => {
  it("strips trailing slashes from the issuer", () => {
    const meta = buildDiscoveryMetadata({ issuer: "https://acme.auth.sdk.enterprises/" });
    expect(meta.issuer).toBe("https://acme.auth.sdk.enterprises");
    expect(meta.authorization_endpoint).toBe(
      "https://acme.auth.sdk.enterprises/authorize",
    );
    expect(meta.token_endpoint).toBe("https://acme.auth.sdk.enterprises/oauth/token");
    expect(meta.userinfo_endpoint).toBe("https://acme.auth.sdk.enterprises/oauth/userinfo");
    expect(meta.revocation_endpoint).toBe(
      "https://acme.auth.sdk.enterprises/oauth/revoke",
    );
    expect(meta.jwks_uri).toBe(
      "https://acme.auth.sdk.enterprises/.well-known/jwks.json",
    );
  });

  it("advertises the OAuth 2.1 surface", () => {
    const meta = buildDiscoveryMetadata({ issuer: "https://x.example" });
    expect(meta.response_types_supported).toEqual(["code"]);
    expect(meta.grant_types_supported).toEqual(["authorization_code", "refresh_token"]);
    expect(meta.code_challenge_methods_supported).toEqual(["S256"]);
    expect(meta.id_token_signing_alg_values_supported).toEqual(["RS256"]);
    expect(meta.scopes_supported).toContain("offline_access");
  });
});
