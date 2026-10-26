/**
 * Generate the voiceover for a project script, one line per request, with
 * character timestamps, prosody stitched across lines, and a content-hash
 * cache so a re-render never spends credits on an unchanged line.
 *
 *   npm run voice:tts -- projects/<slug>/script.json [--takes 3] [--force]
 *
 * Output under MEDIA_ROOT/vo/<slug>/<lineId>.take<N>.wav + .alignment.json,
 * and projects/<slug>/vo.json listing the chosen take per line (defaults to
 * take 1; the editor changes it after listening).
 *
 * Script format (projects/_TEMPLATE/script.json): each line has `id`,
 * `display` (what captions show) and `spoken` (what the voice reads: codes
 * letter by letter, prices in words). Never send `display` to TTS.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { assertMediaRoot, env, mediaPath, require as requireEnv } from "../lib/env";
import { runOrThrow } from "../lib/shell";
import { ttsWithTimestamps } from "./elevenlabs";

export const scriptSchema = z.object({
  slug: z.string(),
  locale: z.string().default("en"),
  voice: z.object({
    modelId: z.enum(["eleven_v4", "eleven_multilingual_v2"]).default("eleven_v4"),
    stability: z.number().min(0).max(1).default(0.45),
    similarityBoost: z.number().min(0).max(1).default(0.75),
  }).default({ modelId: "eleven_v4", stability: 0.45, similarityBoost: 0.75 }),
  lines: z.array(z.object({
    id: z.string(),
    scene: z.string(),
    display: z.string(),
    spoken: z.string(),
    /** One English delivery tag, e.g. "[calm, reassuring]"; prepended to `spoken`. */
    tag: z.string().optional(),
    /** Per-line stability override (lower = more expressive). */
    stability: z.number().min(0).max(1).optional(),
  })).min(1),
});
export type Script = z.infer<typeof scriptSchema>;

export const lineHash = (s: Script, line: Script["lines"][number], voiceId: string): string =>
  createHash("sha256")
    .update(JSON.stringify([voiceId, s.voice, s.locale, line.spoken, line.tag ?? "", line.stability ?? null]))
    .digest("hex")
    .slice(0, 16);

const pcmToWav = async (pcm: string, wav: string) => {
  await runOrThrow("ffmpeg", ["-hide_banner", "-y", "-f", "s16le", "-ar", "48000", "-ac", "1", "-i", pcm, "-c:a", "pcm_s24le", wav]);
};

const main = async () => {
  assertMediaRoot();
  const args = process.argv.slice(2);
  const scriptPath = args.find((a) => !a.startsWith("--"));
  if (!scriptPath) throw new Error("usage: npm run voice:tts -- projects/<slug>/script.json [--takes N] [--force]");
  const takes = Number(args[args.indexOf("--takes") + 1] || 1) || 1;
  const force = args.includes("--force");
  const script = scriptSchema.parse(JSON.parse(readFileSync(scriptPath, "utf8")));
  const voiceId = requireEnv("elevenlabsVoiceId", "Pick the narrator from the listen set (docs/voice-guide.md).");
  const dictionary = env.elevenlabsDictionaryId && env.elevenlabsDictionaryVersionId
    ? { id: env.elevenlabsDictionaryId, versionId: env.elevenlabsDictionaryVersionId }
    : null;
  if (!dictionary) console.warn("No pronunciation dictionary pinned in .env; 'Skanyx' may be misread. Run npm run voice:dictionaries.");

  const outDir = mediaPath("vo", script.slug);
  mkdirSync(outDir, { recursive: true });
  const voJsonPath = path.join(path.dirname(scriptPath), "vo.json");
  const vo: Record<string, { hash: string; take: number; takes: number; wav: string; alignment: string }> =
    existsSync(voJsonPath) ? (JSON.parse(readFileSync(voJsonPath, "utf8")) as typeof vo) : {};

  const previous: string[] = [];
  for (const line of script.lines) {
    const hash = lineHash(script, line, voiceId);
    const cached = vo[line.id];
    if (cached && cached.hash === hash && !force && existsSync(path.join(outDir, cached.wav))) {
      console.log(`${line.id}: cached (${hash})`);
      continue;
    }
    for (let t = 1; t <= takes; t++) {
      const text = line.tag ? `${line.tag} ${line.spoken}` : line.spoken;
      const res = await ttsWithTimestamps({
        voiceId,
        text,
        modelId: script.voice.modelId,
        languageCode: script.locale,
        outputFormat: "pcm_48000",
        seed: t,
        previousRequestIds: previous,
        voiceSettings: { stability: line.stability ?? script.voice.stability, similarity_boost: script.voice.similarityBoost },
        dictionary,
        applyTextNormalization: "off",
      });
      const stem = `${line.id}.take${t}`;
      const pcm = path.join(outDir, `${stem}.pcm`);
      const wav = path.join(outDir, `${stem}.wav`);
      writeFileSync(pcm, Buffer.from(res.audioBase64, "base64"));
      await pcmToWav(pcm, wav);
      writeFileSync(path.join(outDir, `${stem}.alignment.json`), JSON.stringify({
        hash, text, requestId: res.requestId, alignment: res.alignment, normalizedAlignment: res.normalizedAlignment,
      }, null, 2));
      if (t === 1 && res.requestId) previous.push(res.requestId);
      console.log(`${line.id}: take ${t} -> ${path.basename(wav)}`);
    }
    vo[line.id] = { hash, take: cached?.hash === hash ? cached.take : 1, takes, wav: `${line.id}.take1.wav`, alignment: `${line.id}.take1.alignment.json` };
    writeFileSync(voJsonPath, JSON.stringify(vo, null, 2));
  }
  console.log(`VO for ${script.slug} in ${outDir}; chosen takes in ${voJsonPath}`);
};

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
}
