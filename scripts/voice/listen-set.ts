/**
 * The narrator audition. Shortlists English Voice Library voices that meet
 * the studio's bar, renders the SAME test script with each, and writes a
 * blind listening folder (voices numbered, the key in a separate file) so
 * the owner picks by ear, not by name.
 *
 *   npm run voice:listen-set -- search            # print candidates
 *   npm run voice:listen-set -- render <voice_id> [<voice_id>...]
 *
 * Bar (docs/research/02 section 4): professional voice clone of a real
 * actor, Studio quality, notice period >= 1 year, no live moderation, not
 * one of the six most-used defaults (Brian, Liam, Adam, Jessica, Matilda,
 * Sarah). Candidates found by `search` must be added to the account with
 * `addSharedVoice` before `render` can use them; the script does that.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assertMediaRoot, mediaPath } from "../lib/env";
import { runOrThrow } from "../lib/shell";
import { addSharedVoice, searchVoiceLibrary, ttsWithTimestamps } from "./elevenlabs";

const OVERUSED = new Set(["Brian", "Liam", "Adam", "Jessica", "Matilda", "Sarah"]);

/** One test script: hook, verdict, cost, CTA. The spoken forms are final. */
export const testScript = [
  "[calm] That orange engine light just came on, and your first thought was the worst one.",
  "Plug in a cheap adapter, open Skanyx, and read what the car is telling you.",
  "P zero four two zero. The catalytic converter is not cleaning the exhaust the way it should.",
  "[reassuring] It is safe to keep driving for now. The fix is roughly three hundred to twelve hundred euros at an independent workshop.",
  "Skanyx is free on iOS and Android.",
];

const search = async () => {
  const voices = await searchVoiceLibrary({
    language: "en",
    category: "professional",
    use_cases: "narrative_story",
    page_size: "100",
    sort: "trending",
  });
  const ok = voices.filter(
    (v) =>
      !OVERUSED.has(v.name) &&
      (v.notice_period ?? 0) >= 365 &&
      !v.live_moderation_enabled,
  );
  console.log(`${ok.length} candidates of ${voices.length}:`);
  for (const v of ok.slice(0, 40)) {
    console.log(`${v.voice_id}  owner=${v.public_owner_id}  ${v.name} | ${v.gender}, ${v.age}, ${v.accent} | ${v.description.slice(0, 80)}`);
  }
  console.log("\nRender: npm run voice:listen-set -- render <voice_id>:<owner_id> ...");
};

const render = async (ids: string[]) => {
  assertMediaRoot();
  const dir = mediaPath("vo", "_listen-set");
  mkdirSync(dir, { recursive: true });
  const key: Record<string, string> = {};
  let n = 0;
  for (const spec of ids) {
    const [voiceId, ownerId] = spec.split(":");
    if (!voiceId) continue;
    let usableId = voiceId;
    if (ownerId) {
      try {
        usableId = (await addSharedVoice(ownerId, voiceId, `audition-${voiceId.slice(0, 6)}`)).voice_id;
      } catch (e) {
        // Already added is fine; anything else is not.
        if (!(e instanceof Error && /already/i.test(e.message))) throw e;
      }
    }
    n++;
    const parts: string[] = [];
    let previous: string[] = [];
    for (let i = 0; i < testScript.length; i++) {
      const res = await ttsWithTimestamps({
        voiceId: usableId,
        text: testScript[i] as string,
        outputFormat: "pcm_48000",
        languageCode: "en",
        previousRequestIds: previous,
        voiceSettings: { stability: 0.45, similarity_boost: 0.75 },
        applyTextNormalization: "off",
      });
      if (res.requestId) previous = [...previous, res.requestId];
      const pcm = path.join(dir, `candidate-${n}.line${i + 1}.pcm`);
      writeFileSync(pcm, Buffer.from(res.audioBase64, "base64"));
      parts.push(pcm);
    }
    // Concatenate with 600 ms gaps into one WAV per candidate.
    const list = path.join(dir, `candidate-${n}.txt`);
    writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
    const wav = path.join(dir, `candidate-${n}.wav`);
    await runOrThrow("ffmpeg", [
      "-hide_banner", "-y", "-f", "s16le", "-ar", "48000", "-ac", "1", "-f", "concat", "-safe", "0", "-i", list,
      "-af", "apad=pad_dur=0.6", "-c:a", "pcm_s16le", wav,
    ]);
    key[`candidate-${n}`] = spec;
    console.log(`candidate-${n} -> ${wav}`);
  }
  writeFileSync(path.join(dir, "KEY.json"), JSON.stringify(key, null, 2));
  console.log(`\nListen blind to candidate-*.wav; the mapping is in KEY.json. Record the pick in docs/voice-guide.md and .env.`);
};

const main = async () => {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "search") return search();
  if (cmd === "render" && rest.length) return render(rest);
  console.log("usage: npm run voice:listen-set -- search | render <voice_id[:owner_id]>...");
};

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
}
