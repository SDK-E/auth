import { importJWK, jwtVerify } from "jose";
import { importPublicKey } from "./keys.ts";

export async function verifySignedJwt(token: string): Promise<Record<string, unknown>> {
  const [headerPart] = token.split(".");
  if (!headerPart) throw new Error("malformed token");
  const header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8")) as {
    kid?: string;
    alg?: string;
  };
  if (header.alg !== "RS256" || !header.kid) throw new Error("unsupported token header");
  const jwk = await importPublicKey(header.kid);
  if (!jwk) throw new Error(`unknown kid ${header.kid}`);
  const key = await importJWK(jwk, "RS256");
  const { payload } = await jwtVerify(token, key, { algorithms: ["RS256"] });
  return payload as Record<string, unknown>;
}
