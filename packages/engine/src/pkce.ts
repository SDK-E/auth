import { createHash, timingSafeEqual } from "node:crypto";

export function s256Challenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function verifyPkce(verifier: string, challenge: string): boolean {
  const computed = Buffer.from(s256Challenge(verifier));
  const provided = Buffer.from(challenge);
  return computed.length === provided.length && timingSafeEqual(computed, provided);
}
