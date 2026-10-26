# CLAUDE.md: skanyx-studio

Short vertical videos (TikTok, Instagram Reels, YouTube Shorts, Facebook Reels) for Skanyx, the OBD2 car-diagnostics app. Remotion compositions, ElevenLabs narration, real app recordings, real B-roll of the team's own cars. The bar is **premium and real**: nothing that reads as AI-made, nothing the team cannot stand behind. English only for now (owner, 2026-10-26); `locale` stays a field everywhere so a second language is a voice and a translated script, not a rebuild.

Environment design and the research behind every choice: `docs/research/00-environment-design.md` (read it once) and `01`-`05` next to it.

## Read first, by task

| Task | Read |
|---|---|
| Any new video | `/video-brief` skill, then `/video-script`, then `/video-review` (`.claude/skills/`) |
| Writing or motion rules | `docs/style-guide.md`; design questions go to the `apple-design` and `emil-design-eng` skills (symlinked from the web repo) |
| Before publishing | `docs/checklist.md` (20 items), `docs/disclosure.md` (labels, badges, claims) |
| Voice | `docs/voice-guide.md` |
| Filming | `docs/shooting-guide.md` |
| Remotion API | the `remotion-*` skills in `.claude/skills/` (official, project-local; refresh with `npx remotion skills add` after `npm run upgrade`) |

## Three repos, one direction of truth

- **This repo**: compositions, voice, mix, render, QA. Local commits only; **never `git push`** (the owner pushes).
- **`$WEB_REPO` (`~/CortexAutoWeb`)**: the ONLY source of facts. `scripts/facts.ts` reads `data/dtc-codes/<CODE>.json`, `content/blog/_SYSTEM/REPAIR_PRICES.md`, `CAPABILITY_GROUND_TRUTH.md`, `SKANYX_POSITIONING.md`, `data/dtc-stats.json`. The studio keeps no copies: `npm run facts -- code P0420`. A code with no page is not a video subject. Never edit the web repo from here.
- **`$APP_REPO` (`~/car_health_ai`)**: scripted app recordings (a video-capture branch, see research 05 D2/D3; not built yet). Its outputs land in `media/raw/rec/` with a `<take>.taps.json`.

Media (raw, mezzanine, voice takes, renders) lives on the external SSD at `MEDIA_ROOT`, reached through `public/media` (symlink, `npm run media:setup`). Nothing under it enters git; `manifests/media.jsonl` indexes it.

## Pipeline (one video)

```
/video-brief  -> projects/<slug>/brief.md            owner approves
/video-script -> projects/<slug>/script.json         claims signed by a named person
npm run voice:tts -- projects/<slug>/script.json      -> media/vo/<slug>/, vo.json (choose takes by ear)
(app repo) capture -> media/raw/rec/<take>.mov + .taps.json
npm run media:normalise -- --kind rec|broll <files>   -> media/mezz/ (CFR H.264 bt709, flash sync)
Remotion composition in src/templates/<name>/        (Studio: npm run dev; safe-zone overlay on)
npm run render -- <CompId> --props projects/<slug>/props.json   (overlay must be "none")
npm run audio:mix -- projects/<slug> --video <render>  -> .master.wav + .final.mp4 (-14 LUFS, linear)
npm run qa -- <final> --project projects/<slug>        spec, loudness, captions, sign-off, contact sheet
/video-review -> review.md                            owner approves the final
publish by hand per projects/<slug>/publish.md        toggles from docs/disclosure.md
```

## Invariants (each one is a gate, not advice)

- **Claims**: every number and capability traces to a web-repo file path recorded in `review.md`; "Free on iOS and Android" exactly; adapter note next to "free"; "safe to drive" is the app's per-code guidance, never a verdict on the filmed car; EUR ranges with "roughly"; never "Wi-Fi adapter".
- **Footage**: team-filmed on the team's cars; the demo vehicle on screen is the filmed car or the frame says "Demo data"; sped-up app footage says "Sequences shortened". No stock, no AI imagery, no grading of app recordings, iPhone frame never tilted or animated, Apple badge first and static.
- **Media enters only through `media:normalise`**: `<Recording>` and B-roll components read `media/mezz/` only; `@remotion/media` `<Video>` with `disallowFallbackToOffthreadVideo` so a bad file fails loudly instead of switching decoders.
- **Safe zones**: text, logos, key UI inside x 120-880 / y 288-1248 (`slots` in `src/lib/safe-zones.ts`), TikTok rail clear. Provisional (`calibrated = false`) until the `SafeZoneCalibration` upload is screenshotted on real phones; then fix the numbers and flip the flag in the same commit.
- **Captions** from the voice alignment, at most 2 lines / ~28 chars / 17 cps / 0.8 s, one emphasised word (`lintPages`).
- **Motion**: tokens in `src/brand/motion.ts` only; hard cuts on voice beats; nothing decorative animates.
- **Audio**: one master at -14 LUFS, -1.5 dBTP, LRA at most 7, `loudnorm` linear mode asserted; the approved voice WAV is the master artefact (v4 is not reproducible).
- **Render**: `finalRender` settings (h264 crf 16 slow, yuv420p, bt709, png frames, AAC 320k 48 kHz); `scripts/render.ts` refuses a final with an overlay on.
- **Disclosure** per post: TikTok Your brand + AI label, Meta AI label, YouTube altered content = Yes. The burned-in AI-voice mark is off until the lawyer answers research 04 section 10 Q1.
- **Secrets**: `.env` only (gitignored). The studio uses its own ElevenLabs key; the app's voice-agent key is never used here. Credits are spent only by `voice:*` scripts and only when asked.

## Commands

```
npm run dev              Remotion Studio (overlay toggle lives in each composition's props)
npm run check            lint + typecheck + vitest (the Stop hook runs this; CI tier)
npm run media:setup      create MEDIA_ROOT tree, link public/media
npm run media:normalise  raw -> mezzanine (+ flash sync for recordings)
npm run media:manifest   list | verify
npm run facts            code <CODE> | prices <text> | capability <text> | positioning
npm run voice:listen-set search | render <voice_id:owner_id>...   (blind narrator pick)
npm run voice:dictionaries   create skanyx-en, print ids for .env
npm run voice:tts        script.json [--takes N] [--force]   (spends credits)
npm run audio:mix        projects/<slug> [--video render.mp4]
npm run render           <CompId> [--props file] [--draft]
npm run qa               <final.mp4> [--project projects/<slug>]
npm run upgrade          remotion upgrade (then `npx remotion skills add` to refresh the skills)
```

Toolchain: Node 26 (`.nvmrc`), Remotion 4.0.539 pinned exact across every `@remotion/*`, ffmpeg 8 and ffprobe on PATH, python3 for the hooks, zod 4, React 19.

## Hooks and gates

`.claude/settings.json`: PostToolUse `scripts/hooks/code-gate.py` (eslint + tsc on the edited file; exit 2 blocks), Stop `scripts/hooks/finish-gate.py` (`npm run check` when code changed; blocks at most 3 times per turn, then stands down loudly, which is not a pass). `git push` is denied in permissions. Renders never run in a hook.

## Repo layout

```
src/brand/        tokens (amber #D4A054, obsidian/carbon/graphite, status.* for data only), motion, fonts (local Geist), render-settings
src/lib/          captions-from-alignment, tap-timeline (zod), safe-zones, fit-text, loudness, spec-gate  (+ __tests__)
src/components/   PhoneFrame, Recording, TapRings, Captions, CodeChip, SeverityBar, CostRange, EndCard, SafeZoneOverlay
src/calibration/  SafeZoneCalibration composition
src/templates/    (empty) one folder per template; register in src/Root.tsx
scripts/          facts, media/{normalise,manifest}, voice/{elevenlabs,tts,dictionaries,listen-set}, audio/mix, render, qa, hooks/
projects/         one folder per video: brief.md, script.json, timeline.json, review.md, publish.md (copy _TEMPLATE)
public/fonts      Geist woff2; public/devices, public/badges: artwork a human downloads (README in each; QA warns on fallbacks)
manifests/        media.jsonl (tracked index of the SSD)
docs/             style-guide, checklist, disclosure, shooting-guide, voice-guide, research/
```

## Do not

- Push, or add a remote and push, from an agent session.
- Put a claim in a video that `npm run facts` cannot show you.
- Reference `media/raw/` from a composition, or scale/grade an app recording.
- Use a global Remotion skill, a Remotion MCP, or upgrade one `@remotion/*` package without the others.
- Spend ElevenLabs credits (any `voice:*` script) without being asked in that turn.
- Add music from Eleven Music (individual-use terms below the Scale plan) or any track without a licence URL in the manifest.
- Write "Android coming soon", "Wi-Fi adapter", "unlimited", "free trial" (none are true).
- Create documentation files beyond the ones listed here unless asked.
