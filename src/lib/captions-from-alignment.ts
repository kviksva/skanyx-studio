/**
 * ElevenLabs `with-timestamps` alignment -> Remotion `Caption[]` -> caption
 * pages (phrases) that obey the readability rules.
 *
 * Input shape (ElevenLabs TTS with timestamps, `alignment` or
 * `normalized_alignment`): parallel arrays of characters and their start and
 * end seconds. We group characters into words, then words into pages.
 *
 * Rules (docs/style-guide.md "Captions"): phrase-based, at most 2 lines of
 * about 28 characters, at most 17 characters per second, at least 0.8 s on
 * screen, break after punctuation and before conjunctions, no orphan word.
 */
import type { Caption } from "@remotion/captions";

export type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export type Word = { text: string; startMs: number; endMs: number };

export const wordsFromAlignment = (a: Alignment, offsetMs = 0): Word[] => {
  const words: Word[] = [];
  let current = "";
  let startMs = 0;
  let endMs = 0;
  const flush = () => {
    if (current.trim().length > 0) {
      words.push({ text: current, startMs: startMs + offsetMs, endMs: endMs + offsetMs });
    }
    current = "";
  };
  a.characters.forEach((ch, i) => {
    const s = (a.character_start_times_seconds[i] ?? 0) * 1000;
    const e = (a.character_end_times_seconds[i] ?? s / 1000) * 1000;
    if (/\s/.test(ch)) {
      flush();
      return;
    }
    if (current === "") startMs = s;
    current += ch;
    endMs = e;
  });
  flush();
  return words;
};

export const captionsFromWords = (words: Word[]): Caption[] =>
  words.map((w) => ({
    text: w.text,
    startMs: w.startMs,
    endMs: w.endMs,
    timestampMs: Math.round((w.startMs + w.endMs) / 2),
    confidence: 1,
  }));

export type CaptionPage = {
  /** Lines of text, 1 or 2. */
  lines: string[];
  startMs: number;
  endMs: number;
  /** Characters per second on this page, for the QA lint. */
  cps: number;
};

export type PagingRules = {
  maxCharsPerLine: number;
  maxLines: number;
  maxCps: number;
  minDurationMs: number;
};

export const defaultPagingRules: PagingRules = {
  maxCharsPerLine: 28,
  maxLines: 2,
  maxCps: 17,
  minDurationMs: 800,
};

const endsClause = (t: string) => /[.,;:!?]$/.test(t);
const CONJUNCTIONS = new Set(["and", "but", "or", "so", "because", "if", "when", "which", "that", "then"]);

/**
 * Split a word list into lines of at most `maxCharsPerLine`, preferring to
 * break after punctuation and before a conjunction, never leaving a single
 * word on the last line when it can be avoided.
 */
export const breakIntoLines = (words: string[], maxCharsPerLine: number): string[] => {
  const lines: string[] = [];
  let line: string[] = [];
  const len = (ws: string[]) => ws.join(" ").length;
  for (let i = 0; i < words.length; i++) {
    const w = words[i] as string;
    const next = words[i + 1];
    if (line.length > 0 && len([...line, w]) > maxCharsPerLine) {
      lines.push(line.join(" "));
      line = [w];
      continue;
    }
    line.push(w);
    // Prefer breaking after punctuation or before a conjunction when the line
    // is already over half full.
    const preferBreak = next !== undefined && (endsClause(w) || CONJUNCTIONS.has(next.toLowerCase()));
    if (preferBreak && len(line) >= maxCharsPerLine * 0.5) {
      lines.push(line.join(" "));
      line = [];
    }
  }
  if (line.length > 0) lines.push(line.join(" "));
  // Orphan fix: a one-word last line steals a word from the line above when it fits.
  const last = lines[lines.length - 1];
  const prev = lines[lines.length - 2];
  if (lines.length >= 2 && last && prev && !last.includes(" ")) {
    const prevWords = prev.split(" ");
    const moved = prevWords.pop();
    if (moved && prevWords.length >= 1 && `${moved} ${last}`.length <= maxCharsPerLine) {
      lines[lines.length - 2] = prevWords.join(" ");
      lines[lines.length - 1] = `${moved} ${last}`;
    }
  }
  return lines;
};

/**
 * Group words into pages. A page closes when adding the next word would exceed
 * the character budget (lines x chars), at a sentence end, or when the page
 * already has enough text and the next word starts a new clause.
 */
export const pageWords = (words: Word[], rules: PagingRules = defaultPagingRules): CaptionPage[] => {
  const pages: CaptionPage[] = [];
  let buf: Word[] = [];
  const budget = rules.maxCharsPerLine * rules.maxLines;
  const text = (ws: Word[]) => ws.map((w) => w.text).join(" ");
  const close = () => {
    if (buf.length === 0) return;
    const first = buf[0] as Word;
    const last = buf[buf.length - 1] as Word;
    const startMs = first.startMs;
    const endMs = Math.max(last.endMs, startMs + rules.minDurationMs);
    const chars = text(buf).replace(/\s/g, "").length;
    pages.push({
      lines: breakIntoLines(buf.map((w) => w.text), rules.maxCharsPerLine),
      startMs,
      endMs,
      cps: Math.round((chars / ((endMs - startMs) / 1000)) * 10) / 10,
    });
    buf = [];
  };
  for (const w of words) {
    if (buf.length > 0 && text([...buf, w]).length > budget) close();
    buf.push(w);
    if (/[.!?]$/.test(w.text)) close();
  }
  close();
  // A page must not end after the next one starts.
  for (let i = 0; i < pages.length - 1; i++) {
    const p = pages[i] as CaptionPage;
    const n = pages[i + 1] as CaptionPage;
    if (p.endMs > n.startMs) p.endMs = n.startMs;
  }
  return pages;
};

export type CaptionLint = { page: number; problem: string };

/** QA: every page within the readability rules. */
export const lintPages = (pages: CaptionPage[], rules: PagingRules = defaultPagingRules): CaptionLint[] => {
  const out: CaptionLint[] = [];
  pages.forEach((p, i) => {
    if (p.lines.length > rules.maxLines) out.push({ page: i, problem: `${p.lines.length} lines` });
    p.lines.forEach((l) => {
      if (l.length > rules.maxCharsPerLine + 4) out.push({ page: i, problem: `line "${l}" is ${l.length} chars` });
    });
    if (p.cps > rules.maxCps) out.push({ page: i, problem: `${p.cps} cps` });
    if (p.endMs - p.startMs < rules.minDurationMs) out.push({ page: i, problem: `${p.endMs - p.startMs} ms on screen` });
  });
  return out;
};
