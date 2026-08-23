import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "node:crypto";
import { serverEnv } from "@sdk-e/shared";

const VERSION_PREFIX = "v1";

function masterKey(): Buffer {
  const secret = serverEnv().AUTH_ENCRYPTION_KEY;
  return scryptSync(secret, "sdk-e-auth-envelope-v1", 32);
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION_PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(".");
  const [version, ivPart, tagPart, dataPart] = parts;
  if (parts.length !== 4 || version !== VERSION_PREFIX || !ivPart || !tagPart) {
    throw new Error("invalid encrypted payload format");
  }
  const decipher = createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart ?? "", "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
