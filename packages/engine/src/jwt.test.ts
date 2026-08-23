import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { JWK } from "jose";
import { generateSigningKey, type KeyMaterial } from "./keys.ts";
import { signToken, verifyToken } from "./jwt.ts";

describe("signToken + verifyToken", () => {
  let key: KeyMaterial;
  let other: KeyMaterial;
  let server: Server;
  let jwksUrl: string;

  beforeAll(async () => {
    key = await generateSigningKey("skey_test_jwt");
    other = await generateSigningKey("skey_test_other");
    server = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ keys: [key.publicJwk] }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("jwks server listen failed");
    jwksUrl = `http://127.0.0.1:${address.port}/.well-known/jwks.json`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  async function signed(overrides?: Partial<Parameters<typeof signToken>[0]>): Promise<string> {
    return signToken({
      privateJwk: key.privateJwk as JWK,
      kid: key.kid,
      issuer: "https://acme.auth.sdk.enterprises",
      subject: "usr_123",
      audience: "client_abc",
      lifetimeSeconds: 900,
      claims: { sid: "ses_1", scope: "openid email" },
      ...overrides,
    });
  }

  it("round-trips with all claims preserved", async () => {
    const token = await signed();
    const payload = await verifyToken({
      token,
      issuer: "https://acme.auth.sdk.enterprises",
      audience: "client_abc",
      jwksUrl,
    });
    expect(payload.iss).toBe("https://acme.auth.sdk.enterprises");
    expect(payload.sub).toBe("usr_123");
    expect(payload.aud).toBe("client_abc");
    expect(payload.sid).toBe("ses_1");
    expect(payload.scope).toBe("openid email");
    expect(typeof payload.iat).toBe("number");
    expect(payload.exp).toBe((payload.iat as number) + 900);
    expect(typeof payload.jti).toBe("string");
  });

  it("embeds the kid in the protected header", async () => {
    const token = await signed();
    const [headerPart] = token.split(".");
    const header = JSON.parse(Buffer.from(headerPart ?? "", "base64url").toString("utf8")) as {
      kid?: string;
      alg?: string;
      typ?: string;
    };
    expect(header.kid).toBe(key.kid);
    expect(header.alg).toBe("RS256");
    expect(header.typ).toBe("JWT");
  });

  it("merges custom claims", async () => {
    const token = await signed({ claims: { sid: undefined, scope: undefined, org_id: "org_9" } });
    const payload = await verifyToken({
      token,
      issuer: "https://acme.auth.sdk.enterprises",
      audience: "client_abc",
      jwksUrl,
    });
    expect(payload.org_id).toBe("org_9");
  });

  it("rejects an expired token", async () => {
    const token = await signed({ lifetimeSeconds: -10 });
    await expect(
      verifyToken({
        token,
        issuer: "https://acme.auth.sdk.enterprises",
        audience: "client_abc",
        jwksUrl,
      }),
    ).rejects.toThrow();
  });

  it("rejects a wrong issuer", async () => {
    const token = await signed();
    await expect(
      verifyToken({ token, issuer: "https://evil.example", audience: "client_abc", jwksUrl }),
    ).rejects.toThrow();
  });

  it("rejects a wrong audience", async () => {
    const token = await signed();
    await expect(
      verifyToken({
        token,
        issuer: "https://acme.auth.sdk.enterprises",
        audience: "other_client",
        jwksUrl,
      }),
    ).rejects.toThrow();
  });

  it("rejects a token signed by a key absent from the JWKS", async () => {
    const foreign = await signToken({
      privateJwk: other.privateJwk as JWK,
      kid: other.kid,
      issuer: "https://acme.auth.sdk.enterprises",
      subject: "usr_123",
      audience: "client_abc",
      lifetimeSeconds: 900,
    });
    await expect(
      verifyToken({
        token: foreign,
        issuer: "https://acme.auth.sdk.enterprises",
        audience: "client_abc",
        jwksUrl,
      }),
    ).rejects.toThrow();
  });

  it("rejects a malformed token string", async () => {
    await expect(
      verifyToken({
        token: "not-a-jwt",
        issuer: "https://acme.auth.sdk.enterprises",
        audience: "client_abc",
        jwksUrl,
      }),
    ).rejects.toThrow();
  });
});
