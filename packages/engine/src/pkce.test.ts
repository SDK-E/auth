import { describe, expect, it } from "vitest";
import { s256Challenge, verifyPkce } from "./pkce.ts";

describe("s256Challenge", () => {
  it("matches the RFC 7636 appendix B vector", () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(s256Challenge(verifier)).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("produces base64url without padding", () => {
    expect(s256Challenge("any-verifier")).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});

describe("verifyPkce", () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

  it("accepts the matching verifier", () => {
    expect(verifyPkce(verifier, challenge)).toBe(true);
  });

  it("rejects a different verifier of the same shape", () => {
    const other = `${verifier.slice(0, -1)}Z`;
    expect(verifyPkce(other, challenge)).toBe(false);
  });

  it("rejects a challenge with mismatched length", () => {
    expect(verifyPkce(verifier, "short")).toBe(false);
    expect(verifyPkce(verifier, "")).toBe(false);
  });

  it("rejects an empty verifier against a real challenge", () => {
    expect(verifyPkce("", challenge)).toBe(false);
  });
});
