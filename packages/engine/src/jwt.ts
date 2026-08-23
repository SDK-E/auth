import { SignJWT, createRemoteJWKSet, importJWK, jwtVerify, type JWTPayload, type JWK } from "jose";

export type TokenClaims = JWTPayload & {
  sid?: string;
  scope?: string;
};

export async function signToken(params: {
  privateJwk: JWK;
  kid: string;
  issuer: string;
  subject: string;
  audience: string;
  lifetimeSeconds: number;
  claims?: Record<string, unknown>;
}): Promise<string> {
  const key = await importJWK({ ...params.privateJwk, kid: params.kid }, "RS256");
  const issuedAt = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...params.claims })
    .setProtectedHeader({ alg: "RS256", kid: params.kid, typ: "JWT" })
    .setIssuer(params.issuer)
    .setSubject(params.subject)
    .setAudience(params.audience)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + params.lifetimeSeconds)
    .setJti(crypto.randomUUID())
    .sign(key);
}

export async function verifyToken(params: {
  token: string;
  issuer: string;
  audience: string;
  jwksUrl: string;
}): Promise<JWTPayload> {
  const jwks = createRemoteJWKSet(new URL(params.jwksUrl));
  const { payload } = await jwtVerify(params.token, jwks, {
    issuer: params.issuer,
    audience: params.audience,
  });
  return payload;
}
