/**
 * Final audio master for a project: VO lines placed on the timeline, music
 * ducked under the voice (when a track exists), SFX, two-pass loudnorm to
 * -14 LUFS / -1.5 dBTP in LINEAR mode, 48 kHz 24-bit WAV. Then muxed into
 * the Remotion render. Chain and rationale: docs/research/02 section 7.
 *
 *   npm run audio:mix -- projects/<slug>  [--video media/renders/<slug>.mp4]
 *
 * Inputs read from projects/<slug>/timeline.json:
 *   { "vo": [{ "file": "l1.take1.wav", "atMs": 1200 }, ...],
 *     "music": { "file": "bed-01.wav", "gainDb": -8 } | null,
 *     "sfx": [{ "file": "plug-click.wav", "atMs": 5300, "gainDb": -6 }] }
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { assertMediaRoot, mediaPath } from "../lib/env";
import { run, runOrThrow } from "../lib/shell";
import { judgeLoudness, loudnessTarget, parseEbur128, parseLoudnormJson } from "@/lib/loudness";

const timelineSchema = z.object({
  vo: z.array(z.object({ file: z.string(), atMs: z.number().min(0) })).min(1),
  music: z.object({ file: z.string(), gainDb: z.number().default(-8) }).nullable().default(null),
  sfx: z.array(z.object({ file: z.string(), atMs: z.number().min(0), gainDb: z.number().default(-6) })).default([]),
  durationMs: z.number().positive(),
});

const VO_CHAIN =
  "highpass=f=80,equalizer=f=300:t=q:w=1:g=-2,deesser=i=0.4:m=0.5:f=0.5:s=o," +
  "acompressor=threshold=-20dB:ratio=3:attack=10:release=120:makeup=2";

const main = async () => {
  assertMediaRoot();
  const projectDir = process.argv[2];
  if (!projectDir) throw new Error("usage: npm run audio:mix -- projects/<slug> [--video <render.mp4>]");
  const slug = path.basename(projectDir);
  const tl = timelineSchema.parse(JSON.parse(readFileSync(path.join(projectDir, "timeline.json"), "utf8")));
  const voDir = mediaPath("vo", slug);
  const outDir = mediaPath("renders", slug);
  const master = path.join(outDir, `${slug}.master.wav`);

  // Build the filter graph: every input delayed to its position, VO summed,
  // music ducked by the VO sidechain, SFX summed, all mixed, then loudnorm.
  const inputs: string[] = [];
  const labels: { vo: string[]; sfx: string[]; music: string | null } = { vo: [], sfx: [], music: null };
  const parts: string[] = [];
  let i = 0;
  for (const v of tl.vo) {
    inputs.push("-i", path.join(voDir, v.file));
    parts.push(`[${i}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=mono,adelay=${v.atMs}|${v.atMs}[vo${i}]`);
    labels.vo.push(`[vo${i}]`);
    i++;
  }
  if (tl.music) {
    inputs.push("-i", mediaPath("music", tl.music.file));
    parts.push(`[${i}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=${tl.music.gainDb}dB[mus]`);
    labels.music = "[mus]";
    i++;
  }
  for (const s of tl.sfx) {
    inputs.push("-i", mediaPath("sfx", s.file));
    parts.push(`[${i}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=${s.gainDb}dB,adelay=${s.atMs}|${s.atMs}[sfx${i}]`);
    labels.sfx.push(`[sfx${i}]`);
    i++;
  }
  parts.push(`${labels.vo.join("")}amix=inputs=${labels.vo.length}:duration=longest:normalize=0,${VO_CHAIN},pan=stereo|c0=c0|c1=c0,asplit=2[vo][key]`);
  const mixIn: string[] = ["[vo]"];
  if (labels.music) {
    parts.push(`${labels.music}[key]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=350:knee=4[duck]`);
    mixIn.push("[duck]");
  } else {
    parts.push("[key]anullsink");
  }
  if (labels.sfx.length) {
    parts.push(`${labels.sfx.join("")}amix=inputs=${labels.sfx.length}:duration=longest:normalize=0[sfx]`);
    mixIn.push("[sfx]");
  }
  parts.push(`${mixIn.join("")}amix=inputs=${mixIn.length}:duration=longest:normalize=0,atrim=0:${tl.durationMs / 1000}[mix]`);
  const graph = parts.join(";");
  const t = loudnessTarget;

  // Pass 1: measure.
  const p1 = await run("ffmpeg", ["-hide_banner", ...inputs, "-filter_complex", `${graph};[mix]loudnorm=I=${t.integratedLufs}:TP=${t.truePeakDbtp}:LRA=${t.lra}:print_format=json`, "-f", "null", "-"]);
  if (p1.code !== 0) throw new Error(`pass 1 failed:\n${p1.stderr.slice(-2000)}`);
  const m = parseLoudnormJson(p1.stderr);

  // Pass 2: apply linearly.
  const p2 = await runOrThrow("ffmpeg", [
    "-hide_banner", "-y", ...inputs, "-filter_complex",
    `${graph};[mix]loudnorm=I=${t.integratedLufs}:TP=${t.truePeakDbtp}:LRA=${t.lra}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json,aresample=48000[out]`,
    "-map", "[out]", "-c:a", "pcm_s24le", master,
  ]);
  const applied = parseLoudnormJson(p2.stderr);
  if (applied.normalization_type !== "linear") {
    throw new Error(`loudnorm fell back to ${applied.normalization_type}: the mix's LRA is above ${t.lra} or a peak blocks the gain. Tame the music/SFX peaks instead of accepting dynamic mode.`);
  }

  // Gate.
  const g = await run("ffmpeg", ["-hide_banner", "-i", master, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const verdict = judgeLoudness(parseEbur128(g.stderr));
  writeFileSync(path.join(projectDir, "mix-report.json"), JSON.stringify({ measured: m, verdict }, null, 2));
  if (!verdict.ok) throw new Error(`master outside targets: ${verdict.problems.join("; ")}`);
  console.log(`master -> ${master} (${verdict.ok ? "within targets" : verdict.problems.join("; ")})`);

  // Mux into the render when asked.
  const vIdx = process.argv.indexOf("--video");
  const video = vIdx > 0 ? process.argv[vIdx + 1] : undefined;
  if (video) {
    if (!existsSync(video)) throw new Error(`${video} not found`);
    const final = video.replace(/\.mp4$/, ".final.mp4");
    await runOrThrow("ffmpeg", ["-hide_banner", "-y", "-i", video, "-i", master, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", final]);
    console.log(`final -> ${final}`);
  }
};

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
}
