import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, randomToken, sha256Hex } from "./crypto.ts";

describe("envelope encryption", () => {
  it("round-trips a plaintext", () => {
    const payload = "super-secret-client-password";
    expect(decryptSecret(encryptSecret(payload))).toBe(payload);
  });

  it("round-trips unicode and empty strings", () => {
    for (const value of ["", "décrypté ✓", "multi\nline\tvalue"]) {
      expect(decryptSecret(encryptSecret(value))).toBe(value);
    }
  });

  it("emits v1 payloads with three base64url segments", () => {
    const parts = encryptSecret("x").split(".");
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe("v1");
    expect(parts.slice(1).every((p) => /^[A-Za-z0-9_-]+$/.test(p))).toBe(true);
  });

  it("produces distinct ciphertexts for identical plaintexts", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("rejects a tampered ciphertext", () => {
    const encrypted = encryptSecret("integrity-matters");
    const [version, iv, tag, data] = encrypted.split(".");
    const flipped = `${version}.${iv}.${tag}.${data === "A" ? "B" : "A"}`;
    expect(() => decryptSecret(flipped)).toThrow();
  });

  it("rejects a tampered auth tag", () => {
    const encrypted = encryptSecret("integrity-matters");
    const [version, iv, tag, data] = encrypted.split(".");
    const badTag = `${tag?.slice(0, -1)}${tag?.endsWith("A") ? "B" : "A"}`;
    expect(() => decryptSecret(`${version}.${iv}.${badTag}.${data}`)).toThrow();
  });

  it("rejects malformed payloads", () => {
    expect(() => decryptSecret("")).toThrow();
    expect(() => decryptSecret("v1.only-iv")).toThrow();
    expect(() => decryptSecret(`v2.${encryptSecret("x").split(".").slice(1).join(".")}`)).toThrow();
    expect(() => decryptSecret("garbage-without-dots")).toThrow();
  });
});

describe("randomToken", () => {
  it("produces unpadded base64url of the requested entropy", () => {
    expect(randomToken(32)).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomToken(48)).toMatch(/^[A-Za-z0-9_-]{64}$/);
  });

  it("is unique across draws", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => randomToken()));
    expect(tokens.size).toBe(200);
  });
});

describe("sha256Hex", () => {
  it("matches known digests", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
});
