import { importJWK, SignJWT, jwtVerify } from "jose";
import { describe, expect, it } from "vitest";
import { generateSigningKey } from "./keys.ts";

describe("generateSigningKey", () => {
  it("returns coherent RS256 material stamped with the kid", async () => {
    const material = await generateSigningKey("skey_abc");
    expect(material.kid).toBe("skey_abc");
    expect(material.publicJwk.kty).toBe("RSA");
    expect(material.publicJwk.alg).toBe("RS256");
    expect(material.publicJwk.use).toBe("sig");
    expect(material.publicJwk.kid).toBe("skey_abc");
    expect((material.privateJwk as { kty?: string }).kty).toBe("RSA");
  });

  it("produces distinct keypairs per call", async () => {
    const a = await generateSigningKey("skey_a");
    const b = await generateSigningKey("skey_b");
    expect(a.publicJwk.n).not.toBe(b.publicJwk.n);
  });

  it("pairs private signing with public verification", async () => {
    const material = await generateSigningKey("skey_pair");
    const privateJwk = await importJWK({ ...material.privateJwk, kid: material.kid }, "RS256");
    const publicJwk = await importJWK(material.publicJwk, "RS256");

    const token = await new SignJWT({ purpose: "pairing" })
      .setProtectedHeader({ alg: "RS256", kid: material.kid })
      .setIssuedAt()
      .sign(privateJwk);

    const { payload } = await jwtVerify(token, publicJwk, { algorithms: ["RS256"] });
    expect(payload.purpose).toBe("pairing");
  });

  it("refuses verification with a different public key", async () => {
    const a = await generateSigningKey("skey_a2");
    const b = await generateSigningKey("skey_b2");
    const privateA = await importJWK(a.privateJwk, "RS256");
    const publicB = await importJWK(b.publicJwk, "RS256");

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256", kid: a.kid })
      .sign(privateA);

    await expect(jwtVerify(token, publicB, { algorithms: ["RS256"] })).rejects.toThrow();
  });
});
