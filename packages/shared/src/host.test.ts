import { describe, expect, it } from "vitest";
import { classifyHost, normalizeHostname } from "./host.ts";

describe("classifyHost", () => {
  it("classifies the base domain and its www form", () => {
    expect(classifyHost("auth.sdk.enterprises")).toEqual({
      kind: "base",
      hostname: "auth.sdk.enterprises",
    });
    expect(classifyHost("www.auth.sdk.enterprises")).toEqual({
      kind: "base",
      hostname: "www.auth.sdk.enterprises",
    });
  });

  it("extracts the tenant slug from subdomains", () => {
    const result = classifyHost("acme.auth.sdk.enterprises");
    expect(result).toEqual({
      kind: "tenant",
      tenantSlug: "acme",
      hostname: "acme.auth.sdk.enterprises",
    });
  });

  it("uses the first label as slug for deep subdomains", () => {
    const result = classifyHost("env-2.acme.auth.sdk.enterprises");
    expect(result).toMatchObject({ kind: "tenant", tenantSlug: "env-2" });
  });

  it("treats local development hostnames as local", () => {
    for (const host of ["localhost", "127.0.0.1", "[::1]", "lvh.me"]) {
      expect(classifyHost(host)).toMatchObject({ kind: "local" });
    }
    for (const host of ["app.localhost", "acme.lvh.me"]) {
      expect(classifyHost(host)).toMatchObject({ kind: "local" });
    }
  });

  it("strips ports before classifying", () => {
    expect(classifyHost("localhost:3000")).toMatchObject({ kind: "local" });
    expect(classifyHost("auth.sdk.enterprises:8443")).toMatchObject({ kind: "base" });
    expect(classifyHost("acme.auth.sdk.enterprises:3000")).toMatchObject({
      kind: "tenant",
      tenantSlug: "acme",
    });
  });

  it("normalizes case", () => {
    expect(classifyHost("AUTH.SDK.Enterprises")).toMatchObject({ kind: "base" });
    expect(classifyHost("ACME.Auth.SDK.Enterprises")).toMatchObject({
      kind: "tenant",
      tenantSlug: "acme",
    });
  });

  it("falls back to custom for unknown hostnames", () => {
    expect(classifyHost("login.customer.com")).toEqual({
      kind: "custom",
      hostname: "login.customer.com",
    });
  });

  it("honors a custom base domain", () => {
    expect(classifyHost("preview.acme.dev", "preview.acme.dev")).toMatchObject({
      kind: "base",
    });
    expect(classifyHost("sdk-e.preview.acme.dev", "preview.acme.dev")).toMatchObject({
      kind: "tenant",
      tenantSlug: "sdk-e",
    });
    expect(classifyHost("other.example", "preview.acme.dev")).toMatchObject({
      kind: "custom",
    });
  });

  it("never misclassifies lookalike suffixes", () => {
    expect(classifyHost("notauth.sdk.enterprises")).toMatchObject({
      kind: "custom",
    });
  });
});

describe("normalizeHostname", () => {
  it("lowercases and strips ports", () => {
    expect(normalizeHostname("EXAMPLE.com:8443")).toBe("example.com");
    expect(normalizeHostname("LocalHost")).toBe("localhost");
  });

  it("accepts full URLs and returns only the hostname", () => {
    expect(normalizeHostname("https://Auth.Sdk.Enterprises/path?q=1")).toBe(
      "auth.sdk.enterprises",
    );
    expect(normalizeHostname("http://[::1]:3000/x")).toBe("[::1]");
  });

  it("falls back to naive parsing when URL construction fails", () => {
    expect(normalizeHostname("%zz")).toBe("%zz");
    expect(normalizeHostname("%zz:1234")).toBe("%zz");
  });
});
