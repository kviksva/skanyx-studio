import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { englishRules } from "../voice/dictionaries";
import { lineHash, scriptSchema } from "../voice/tts";

const template = JSON.parse(readFileSync(path.join(__dirname, "..", "..", "projects", "_TEMPLATE", "script.json"), "utf8")) as unknown;

describe("projects/_TEMPLATE/script.json", () => {
  it("parses against the script schema", () => {
    const s = scriptSchema.parse(template);
    expect(s.lines.length).toBeGreaterThan(3);
  });
  it("never puts a raw code or euro sign in the spoken track", () => {
    const s = scriptSchema.parse(template);
    for (const l of s.lines) {
      expect(l.spoken).not.toMatch(/\b[PBCU]\d{4}\b/);
      expect(l.spoken).not.toContain("€");
    }
  });
  it("ends with the one sentence allowed to repeat", () => {
    const s = scriptSchema.parse(template);
    expect(s.lines.at(-1)?.spoken).toBe("Skanyx is free on iOS and Android.");
  });
  it("hashes change when the spoken text changes, not when display changes", () => {
    const s = scriptSchema.parse(template);
    const a = s.lines[0]!;
    expect(lineHash(s, { ...a, display: "x" }, "v")).toBe(lineHash(s, a, "v"));
    expect(lineHash(s, { ...a, spoken: "x" }, "v")).not.toBe(lineHash(s, a, "v"));
  });
});

describe("skanyx-en dictionary", () => {
  it("pins the brand pronunciation in every casing", () => {
    const skanyx = englishRules.filter((r) => r.type === "phoneme");
    expect(skanyx.map((r) => r.string_to_replace).sort()).toEqual(["SKANYX", "Skanyx", "skanyx"]);
    for (const r of skanyx) expect(r.type === "phoneme" && r.phoneme).toBe("ˈskænɪks");
  });
});
