# Skanyx video studio: environment design

Status: approved in conversation 2026-10-26 (structure + four owner decisions). Scope is the ENVIRONMENT, not the first video template. Research behind every choice: `01-remotion.md` … `05-capture-footage.md` in this folder (moved to `docs/research/` in the studio repo).

## 1. Goal and quality bar

Turn a video idea into a top-tier 20-40 s vertical video for TikTok, Instagram Reels, YouTube Shorts and Facebook Reels, fast and repeatably, with nothing that reads as "AI slop": real footage, the real app, restrained motion, accurate claims, native-sounding voice in each language.

## 2. Owner decisions (2026-10-26)

| Decision | Answer | Consequence |
|---|---|---|
| Voice route | **ElevenLabs for all languages** | Eleven v4 TTS everywhere. Platform AI labels are part of every publish (section 9). EU AI Act Art 50 reading goes to a lawyer before the first post. |
| Team size | **3 people or fewer** | Remotion Free License; no licence work. Re-check if headcount (incl. contractors) reaches 4. |
| Music | **Decide later** | Music slot exists in the mix and composition but ships empty; test renders have no music. Eleven Music below the Scale plan is "individual use only", so it is NOT a default. |
| "Skanyx" | **SKAN-iks, /ˈskænɪks/** | Brand pronunciation dictionary rule. |
| Languages | **English only for now** | One English account per platform. Locale stays a field in every script and composition (cheap), but nothing per-locale is built: no other voices, dictionaries or listening sets. A second language later = a new voice + translated script, not a rebuild. |

## 3. Repos and responsibilities

| Repo | Role | Changes |
|---|---|---|
| `~/skanyx-studio` (new, own git, local commits only; the owner pushes) | Composition, voice, mix, render, QA, the idea-to-video workflow | Everything in sections 4-8 |
| `~/car_health_ai` (mobile app) | Scripted app recordings | A video-capture mode on a branch (section 6). Follows that repo's own CLAUDE.md and gates. |
| `~/CortexAutoWeb` (web) | Source of facts | None. The studio reads fault codes, prices, capabilities and term banks from it and never keeps copies. |

Media (raw footage, recordings, voice takes, renders) lives on the external SSD at `MEDIA_ROOT`, never in git.

## 4. Studio repo layout

```
skanyx-studio/
  CLAUDE.md                     # quality bar, brand, claim safety, pipeline, gates, disclosure rules
  .claude/settings.json         # hooks (section 8) + permissions
  .claude/skills/               # Remotion official skills (project-local) + video-brief, video-script, video-review
                                #   + symlinks to the web repo's apple-design / emil-design-eng (motion standard)
  .env                          # gitignored: ELEVENLABS_API_KEY (studio-scoped key), MEDIA_ROOT, WEB_REPO, APP_REPO
  docs/
    research/                   # the five research files + this spec
    style-guide.md              # hook, pacing, caption, voice, motion rules (research 03 section B + 01 D8)
    checklist.md                # the 20-point per-video checklist (research 03 section D), adapted to AI voice
    disclosure.md               # per-platform labels, Apple/Google badge rules, demo-data and claims rules (research 04)
    shooting-guide.md           # iPhone settings, 13-shot list, gear list, car-lighting notes (research 05)
    voice-guide.md              # model, settings, script-writing for the ear, dictionaries, listening protocol (research 02)
  remotion.config.ts
  src/
    index.ts, Root.tsx          # registerRoot; compositions registered per template x aspect
    brand/tokens.ts             # colours from the web repo (amber #D4A054, obsidian #08080A, carbon #0C0C0F, graphite #0F0F12,
                                #   status-* for severity only), type scale, safe zones
    brand/motion.ts             # named easings/durations: enter, move, exit, emphasis; no default bouncy spring
    brand/fonts.ts              # local Geist woff2 (Latin Ext + Cyrillic checked), load-before-render guard
    components/                 # PhoneFrame (Apple bezel, straight-on), Recording (mezzanine + crop + sync offset),
                                #   TapRings (from the app timeline), Captions (from voice alignment), CodeChip,
                                #   SeverityBar, CostRange, EndCard (store badges per Apple/Google rules),
                                #   SafeZoneOverlay (TikTok / Reels / Shorts / union / 3:4 crop, Studio-only toggle)
    lib/                        # captions-from-alignment.ts, tap-timeline.ts, safe-zones.ts, fit-text.ts
    calibration/                # SafeZoneCalibration composition (section 10)
    templates/                  # empty: the first template is the next project, not this one
  scripts/
    facts.ts                    # read-only access to the web repo (dtc-codes, dtc-stats, REPAIR_PRICES, CAPABILITY_GROUND_TRUTH, term-banks)
    media/normalise.ts          # ffmpeg: any input -> CFR H.264 bt709 mezzanine; ffprobe gate rejects bad inputs
    media/manifest.ts           # append/verify manifests/media.jsonl (path, sha256, source, licence, date)
    voice/tts.ts                # Eleven v4 with-timestamps, per line, stitching, dictionaries, cache keyed by content hash
    voice/dictionaries.ts       # create/version the skanyx-en pronunciation dictionary
    voice/listen-set.ts         # the same test script in each shortlisted voice, for a blind pick
    audio/mix.ts                # VO + (music) + SFX: EQ/de-ess, ducking, two-pass loudnorm -14 LUFS / -1.5 dBTP, gate
    render.ts                   # bundle once, renderMedia per variant, final settings (section 7)
    qa.ts                       # ffprobe spec gate, loudness gate, duration gate, caption lint, contact sheet
  projects/<slug>/              # one folder per video: brief.md, script.json, review.md, publish.md
  manifests/media.jsonl         # tracked index of everything under MEDIA_ROOT
  media -> $MEDIA_ROOT          # symlink (gitignored): raw/, mezz/, vo/, sfx/, music/, renders/, qa/
```

Runtime: Remotion 4.0.538 pinned exactly (all `@remotion/*` equal), React 19.2.3, zod 4.5.4, TypeScript strict. Node: system Node 26 after one verified render; fallback Node 24 (`/opt/homebrew/opt/node@24`). No Remotion MCP, no global Remotion skills.

## 5. Voice and audio

- Model `eleven_v4`, `POST /v1/text-to-speech/{voice_id}/with-timestamps`, `language_code: "en"`, `wav_48000`, `apply_text_normalization: "off"` (scripts carry a pre-normalised spoken track), stitching via `previous_request_ids`, dictionary pinned by `version_id`. The model is a setting, so `eleven_multilingual_v2` (which has `<break>` and `speed`) stays a fallback if v4's delivery disappoints.
- Voice: one English Voice Library voice, preferring a PVC of a real voice actor (Studio Quality, long notice period, no Live Moderation), never the six most-used defaults (Brian, Liam, Adam, Jessica, Matilda, Sarah). Shortlist 3-5, render the same test script with each, the owner picks blind.
- Scripts have two tracks per line: `display` (captions, on-screen) and `spoken` (fault codes letter and digit by digit, prices in words).
- Dictionary: `skanyx-en` with Skanyx /ˈskænɪks/ plus aliases for OBD2, PPI and any acronym a test take misreads.
- Every approved take is archived on the SSD (v4 output is not reproducible).
- Mix chain: high-pass, gentle EQ, de-ess, compression on VO; music (when chosen) ducked under VO; SFX from ElevenLabs Sound Effects; two-pass `loudnorm` to -14 LUFS integrated, -1.5 dBTP, linear mode asserted; master 48 kHz/24-bit, delivered AAC 320 kbps.
- Studio-scoped ElevenLabs key with a credit cap, separate from the app's voice-agent key.

## 6. App capture (mobile repo, branch)

- `VideoCaptureBinding`: `framePolicy = benchmarkLive`, an unrecorded warm-up pass per take, no debug tap crosshairs, records every tap and route/screen change with monotonic times, janky-frame count per take.
- A full-screen white flash at take start; the normaliser finds it and converts timeline times to video times (target: within 1 frame).
- Recorder script: `simctl status_bar override`, `xcrun simctl io <udid> recordVideo --codec=hevc --mask=ignored`, start/stop driven by marker files; no `open -a Simulator` (Xcode 27 replaced Simulator.app; verify).
- A demo vehicle matching the car on camera (BMW E60 535d), so the screen never contradicts the filmed car. Where a shot still implies "this reading came from this car" and it did not, the frame carries a small "Demo data" note.
- Output: raw HEVC master on the SSD, H.264 CFR 60 fps mezzanine for Remotion, plus `<take>.taps.json`.

## 7. Composition and render rules

- Canvas 1080x1920, 30 fps constant (25 if B-roll is shot at 25/50). Footage enters only through the normaliser.
- Union safe rectangle x 120-888, y 288-1248 for all text, logos and key UI; TikTok right rail (x > 880, y 840-1500) kept clear; frame 0 is the cover (no logo, no fade).
- Captions phrase-based from the voice alignment: at most 2 lines, about 28 characters per line, at most 17 characters per second, at least 0.8 s on screen, solid dark plate, contrast at least 4.5:1, one emphasised word at most.
- Motion: named tokens only, hard cuts on voice beats, no ripple/light-leak/bouncy transitions, motion blur only on fast phone moves, the iPhone frame never tilted or spun (Apple).
- Final render: `--codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --image-format=png --audio-codec=aac --audio-bitrate=320k --sample-rate=48000`; drafts may use hardware acceleration.

## 8. Agent workflow and gates

- Skills: `/video-brief` (idea -> scenario, hook archetype, the three answers, every claim with its source file), `/video-script` (display + spoken tracks per locale, claim check against CAPABILITY_GROUND_TRUTH / REPAIR_PRICES / dtc-codes, variation check against recent projects), `/video-review` (runs `qa.ts`, reads the contact sheet, walks the checklist, writes `review.md`).
- Human gates: owner approves the brief; a named reviewer signs off the script's claims; owner approves the final render.
- Hooks: PostToolUse on JS/TS edits = eslint + tsc for the edited file; Stop = typecheck + lint + unit tests (caption converter, tap timeline, safe zones, loudness-gate parser). Kept fast; renders are never in a hook.
- Unit tests cover the pure logic in `src/lib/` and the gates in `scripts/qa.ts`.

## 9. Disclosure and publishing (manual for now)

Per post: TikTok "Disclose commercial content > Your brand" + AI-generated label; Meta AI label; YouTube "altered or synthetic content" = Yes. Apple/Google: one static black App Store badge first, Google Play badge same height, localised artwork, credit lines; "Sequences shortened" on sped-up app footage; incidental BMW badges only, never a roundel thumbnail. `EndCard` supports an optional burned-in "AI voice" mark; whether it is on by default follows the lawyer's answer on the EU AI Act. Publishing automation and the `social_*` attribution exemption are a later project.

## 10. Done means (verification of the environment)

1. `SafeZoneCalibration` renders; the owner uploads it privately to all four platforms and sends phone screenshots; the safe-zone numbers are corrected from those.
2. One app capture take: 60 fps cadence measured from frame timestamps, no crosshairs, sync offset within 1 frame, status bar as intended.
3. `listen-set.ts` renders the same test script with each shortlisted English voice; the owner's blind pick is recorded in `docs/voice-guide.md`.
4. One end-to-end render (calibration composition + a VO line + a mezzanine clip) passes every `qa.ts` gate; Node 26 render verified.
5. Hooks run and pass; `npm test` green.

## 11. Open items (not blockers for building the environment)

- Studio-scoped ElevenLabs API key (owner creates; Claude stores it in `.env`).
- SSD volume name for `MEDIA_ROOT`.
- Apple product bezels and store-badge artwork are downloaded from Apple Design Resources / Apple Marketing Tools / Google's badge page (terms may need a human click-through).
- Lawyer: the six questions in `04-disclosure-legal.md` section 10 before the first post.
- Music source before the first video with music.
- Which iPhone the team films on (Apple Log/ProRes needs 15 Pro or newer).
