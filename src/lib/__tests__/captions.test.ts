import { describe, expect, it } from "vitest";
import {
  breakIntoLines,
  lintPages,
  pageWords,
  wordsFromAlignment,
  type Alignment,
} from "../captions-from-alignment";

const align = (text: string, msPerChar = 60): Alignment => {
  const characters = [...text];
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => (i * msPerChar) / 1000),
    character_end_times_seconds: characters.map((_, i) => ((i + 1) * msPerChar) / 1000),
  };
};

describe("wordsFromAlignment", () => {
  it("groups characters into words with start/end from the first and last character", () => {
    const words = wordsFromAlignment(align("Your car is fine."));
    expect(words.map((w) => w.text)).toEqual(["Your", "car", "is", "fine."]);
    expect(words[0]).toMatchObject({ startMs: 0, endMs: 240 });
    expect(words[3]?.startMs).toBe(12 * 60);
  });

  it("applies an offset for a line placed later in the timeline", () => {
    const words = wordsFromAlignment(align("Hi there"), 5000);
    expect(words[0]?.startMs).toBe(5000);
  });
});

describe("breakIntoLines", () => {
  it("keeps a short phrase on one line", () => {
    expect(breakIntoLines("P0420 is a catalyst code".split(" "), 28)).toEqual(["P0420 is a catalyst code"]);
  });

  it("breaks before a conjunction once the line is half full", () => {
    const lines = breakIntoLines("It is safe to drive today but not for long".split(" "), 28);
    expect(lines).toEqual(["It is safe to drive today", "but not for long"]);
  });

  it("never leaves a single orphan word on the last line when it can be avoided", () => {
    const lines = breakIntoLines("roughly two hundred to four hundred euros fitted".split(" "), 28);
    expect(lines.every((l) => l.includes(" "))).toBe(true);
    expect(lines.every((l) => l.length <= 28)).toBe(true);
  });
});

describe("pageWords", () => {
  it("closes a page at a sentence end and keeps pages inside the budget", () => {
    const text = "Your engine light is on. The code is P0420. It is safe to drive for now.";
    const pages = pageWords(wordsFromAlignment(align(text)));
    expect(pages.map((p) => p.lines.join(" "))).toEqual([
      "Your engine light is on.",
      "The code is P0420.",
      "It is safe to drive for now.",
    ]);
    expect(pages.every((p) => p.lines.length <= 2)).toBe(true);
  });

  it("enforces a minimum time on screen without overlapping the next page", () => {
    const pages = pageWords(wordsFromAlignment(align("Yes. No. Maybe so.", 20)));
    expect(pages[0]?.endMs).toBeLessThanOrEqual(pages[1]?.startMs ?? Infinity);
    const last = pages[pages.length - 1];
    expect((last?.endMs ?? 0) - (last?.startMs ?? 0)).toBeGreaterThanOrEqual(800);
  });

  it("lints a page that reads too fast", () => {
    const pages = pageWords(wordsFromAlignment(align("this sentence is spoken far too quickly for anyone", 15)));
    const problems = lintPages(pages);
    expect(problems.some((p) => p.problem.includes("cps"))).toBe(true);
  });
});
