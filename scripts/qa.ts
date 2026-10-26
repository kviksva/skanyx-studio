/**
 * Automated gates on a FINAL file, plus a contact sheet for the human and
 * agent review. Exit 1 on any hard failure; warnings are printed.
 *
 *   npm run qa -- <final.mp4> [--project projects/<slug>]
 *
 * Gates: delivery spec (ffprobe), loudness (ebur128), duration, and, when a
 * project folder is given, the caption pages lint and a check that the
 * script's claims file was signed off.
 * Output: <file>.qa.json next to the file and <file>.sheet.png (a 4x6 grid
 * of frames, one every ~1.5 s) for `/video-review`.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { judgeLoudness, parseEbur128 } from "@/lib/loudness";
import { judgeSpec } from "@/lib/spec-gate";
import { lintPages, type CaptionPage } from "@/lib/captions-from-alignment";
import { run, runOrThrow } from "./lib/shell";
import { probe } from "./lib/probe";

const main = async () => {
  const file = process.argv[2];
  if (!file || !existsSync(file)) throw new Error("usage: npm run qa -- <final.mp4> [--project projects/<slug>]");
  const pIdx = process.argv.indexOf("--project");
  const project = pIdx > 0 ? process.argv[pIdx + 1] : undefined;
  const failures: string[] = [];
  const warnings: string[] = [];

  const summary = await probe(file);
  failures.push(...judgeSpec(summary).map((p) => `spec: ${p}`));

  const l = await run("ffmpeg", ["-hide_banner", "-i", file, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"]);
  if (l.code === 0) {
    const verdict = judgeLoudness(parseEbur128(l.stderr));
    failures.push(...verdict.problems.map((p) => `loudness: ${p}`));
  } else {
    failures.push("loudness: no audio stream to measure");
  }

  if (project) {
    const pagesFile = path.join(project, "captions.json");
    if (existsSync(pagesFile)) {
      const pages = JSON.parse(readFileSync(pagesFile, "utf8")) as CaptionPage[];
      for (const p of lintPages(pages)) warnings.push(`captions page ${p.page}: ${p.problem}`);
    } else {
      warnings.push("no captions.json in the project folder; caption lint skipped");
    }
    const review = path.join(project, "review.md");
    if (!existsSync(review) || !/claims signed off by:\s*\S/i.test(readFileSync(review, "utf8"))) {
      failures.push("review.md is missing a 'Claims signed off by: <name>' line");
    }
  }

  // Contact sheet: 24 frames spread over the duration.
  const sheet = file.replace(/\.mp4$/, ".sheet.png");
  const every = Math.max(1, Math.floor((summary.durationS * summary.fps) / 24));
  await runOrThrow("ffmpeg", ["-hide_banner", "-y", "-i", file, "-vf", `select='not(mod(n\\,${every}))',scale=270:-1,tile=4x6`, "-frames:v", "1", sheet]);

  const report = { file, summary, failures, warnings, sheet };
  writeFileSync(file.replace(/\.mp4$/, ".qa.json"), JSON.stringify(report, null, 2));
  for (const w of warnings) console.log(`WARN  ${w}`);
  for (const f of failures) console.log(`FAIL  ${f}`);
  console.log(`sheet -> ${sheet}`);
  console.log(failures.length === 0 ? "QA: pass" : `QA: ${failures.length} failure(s)`);
  process.exit(failures.length === 0 ? 0 : 1);
};

main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
