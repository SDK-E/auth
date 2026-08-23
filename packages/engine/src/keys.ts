import { exportJWK, generateKeyPair, type JWK } from "jose";

export type KeyMaterial = {
  kid: string;
  publicJwk: JWK;
  privateJwk: JWK;
};

export async function generateSigningKey(kid: string): Promise<KeyMaterial> {
  const { publicKey, privateKey } = await generateKeyPair("RS256", {
    modulusLength: 2048,
    extractable: true,
  });
  const publicJwk = await exportJWK(publicKey);
  const privateJwk = await exportJWK(privateKey);
  publicJwk.kid = kid;
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";
  return { kid, publicJwk, privateJwk };
}
