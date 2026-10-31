# Status and next steps

Last updated 2026-10-31. **Read this at the start of every session; update it at the end of any session that changes something on it.** Auto-memory is per folder, so a session in this repo does not see what was remembered in the web repo: anything the next session must know goes here.

## Where things stand

- **Built**: the environment only (pipeline scripts, composition kit, gates, skills, docs). No template, no footage, no voice, no app recordings yet.
- **Verified 2026-10-26**: `npm run check` green on Node 26.3; `SafeZoneCalibration` renders 1080x1920 h264 yuv420p bt709 30 fps.
- **GitHub**: `kviksva/skanyx-studio`, branch `main`. Agents commit locally; the owner pushes.
- **Decided** (owner, 2026-10-26): ElevenLabs voice for everything; English only; music slot empty for now; "Skanyx" said SKAN-iks; team of 3 or fewer (Remotion free licence).

## Owner to-dos that block the first video

| # | To do | How | Unblocks |
|---|---|---|---|
| 1 | Studio ElevenLabs key with a credit cap | `cp .env.example .env`, paste the key. Never the app's voice-agent key. | all voice work |
| 2 | External SSD | plug in, set `MEDIA_ROOT=/Volumes/<name>/studio` in `.env`, `npm run media:setup` | all media |
| 3 | Pronunciation dictionary | `npm run voice:dictionaries`, paste the two ids into `.env` | correct "Skanyx" |
| 4 | Narrator, picked blind | `npm run voice:listen-set -- search`, then `render` 3-5, listen without `KEY.json`, record the pick in `docs/voice-guide.md` and `.env` | voice |
| 5 | Apple bezel + store badges | `public/devices/README.md`, `public/badges/README.md` | phone frame, end card |
| 6 | Which iPhone films the B-roll | Apple Log / ProRes needs a 15 Pro or newer | shooting settings |
| 7 | Safe-zone calibration | `npm run render -- SafeZoneCalibration`, upload privately to all four platforms, screenshot on an iPhone and a tall Android | final safe-zone numbers |

Before the first **public** post (not before production): the lawyer questions in `docs/research/04-disclosure-legal.md` section 10, and set up the four business accounts. Before any video with music: a licensed music source.

## Build to-dos that block the first video

1. **App capture mode** in `~/car_health_ai`, on a branch, in a session opened in that repo (it has its own CLAUDE.md and gates). Spec: `docs/research/05-capture-footage.md` D1-D3 (`VideoCaptureBinding`, `benchmarkLive`, white sync flash, `<take>.taps.json`, record script without `open -a Simulator`), plus its "Uncertain / verify" items 1-9. The demo vehicle must be the filmed car (E60 535d or E61 535).
2. **First template** in `src/templates/<name>/`, built during the pilot video, not before it (a template designed without real footage and a real voice gets redesigned).
3. Later, web repo: a `social_*` referer exemption so bio-link clicks count. Until then bio links go to `skanyx.com/get?utm_source=<platform>`.

## How to start a session here

Open Claude Code in `~/skanyx-studio`. It reads `CLAUDE.md` by itself. Then one of:

- **Work on an idea**: `/video-brief <the idea in one sentence>`. It writes `projects/<slug>/brief.md` and stops for approval.
- **After approval**: `/video-script projects/<slug>`.
- **After a render**: `/video-review projects/<slug>`.
- **Anything else**: "Read docs/status.md, then <task>."

For the app capture mode, open Claude Code in `~/car_health_ai` and say: "Build the video-capture mode specified in ~/skanyx-studio/docs/research/05-capture-footage.md (Decisions D1-D3) on a new branch, and verify items 1-9 of its Uncertain list on this Mac."

## Recommended order: one pilot, then batches

1. Owner to-dos 1-4 (one evening).
2. Pick ONE pilot idea from the bank below; `/video-brief`; owner approves.
3. In parallel: the app capture mode (app repo session) and the B-roll shoot for the pilot (`docs/shooting-guide.md`, blue hour, shots 1-3-5-6-7-12).
4. `/video-script`, `npm run voice:tts`, then build the template around the pilot's real footage and voice.
5. Render, `audio:mix`, `qa`, `/video-review`, private upload (doubles as the safe-zone calibration check), owner approves.
6. From then on each idea is brief, script, voice, new shots, render. The template is reused; the script never is. Template videos are at most half of each account's output; the rest are human-led formats (research 03 section C).

## Idea bank

Seeded 2026-10-31 from `npm run facts -- stats` (the app's own scans: 806 cars in 365 days, generated 2026-10-23) and `npm run facts -- code <CODE>`. Re-check both before a brief; the numbers move monthly.

| Code | What it is | Cars in the app | Severity, safe to drive | Angle |
|---|---|---|---|---|
| P0420 | Catalytic converter efficiency | 85 (about 1 in 10) | moderate, yes | The most common code by far; feared as expensive. Hook (b): the cost you fear vs the real range. |
| P0300-P0304 | Misfire (random, cylinder 1-4) | 23-34 each | high | The flashing light moment. Hook (a) or (c). One video, not four. |
| P0171 | System too lean | 32 | moderate | Vacuum leak story; a cheap cause is common. Hook (f): myth vs reading. |
| P0101 | Mass air flow sensor range | 29 | moderate | "Clean before you replace." |
| P2002 | Diesel particulate filter efficiency | 24 | high, no | Diesel story; check the 535d's DPF before filming it. The web repo has BMW DPF posts (wave 7) to align with. |
| P0380 | Glow plug circuit | 21 | low, yes | Cold-morning diesel start, timely in November; fits the 535d. |
| P0401 | EGR flow insufficient | 22 | low, yes | Diesel; a clean often fixes it. |

Formats that are not a code: a used-car check walk-through (the PPI report, `/ppi`), "what a garage quote should include", comment replies, team to camera. Rules for every idea: the filmed car really shows the code, or the screen carries "Demo data"; every number comes from `npm run facts`; no count below the dtc-stats floors (15 cars per code, 4 per make).

## Log

- 2026-10-26: environment built and pushed (9b6aed0).
- 2026-10-31: this file; `facts stats` command; example scripts stripped of invented prices.
