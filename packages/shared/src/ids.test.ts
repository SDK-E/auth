import { describe, expect, it } from "vitest";
import { createId, idPrefixes } from "./ids.ts";

describe("createId", () => {
  it("formats as prefix plus 26 lowercase alphanumeric characters", () => {
    expect(createId("usr")).toMatch(/^usr_[0-9a-z]{26}$/);
    expect(createId("tenant")).toMatch(/^tenant_[0-9a-z]{26}$/);
    expect(createId("client")).toMatch(/^client_[0-9a-z]{26}$/);
  });

  it("supports every declared prefix without mangling", () => {
    for (const prefix of Object.values(idPrefixes)) {
      const id = createId(prefix);
      expect(id.startsWith(`${prefix}_`)).toBe(true);
      expect(id.slice(prefix.length + 1)).toHaveLength(26);
    }
  });

  it("is unique across draws", () => {
    const ids = new Set(Array.from({ length: 300 }, () => createId("usr")));
    expect(ids.size).toBe(300);
  });

  it("keeps the alphabet lowercase alphanumeric", () => {
    for (const id of Array.from({ length: 50 }, () => createId("org"))) {
      expect(id.slice("org_".length)).toMatch(/^[0-9a-z]+$/);
    }
  });
});
