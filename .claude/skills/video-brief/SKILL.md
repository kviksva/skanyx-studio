---
name: video-brief
description: Turn a video idea into a brief in projects/<slug>/brief.md - scenario, hook archetype, the three answers, every claim with its source file, shot list and app flow. The first step of every Skanyx short; the owner approves the brief before a script is written.
when_to_use: Use when the owner gives a video idea ("do one about P0420", "a used-car buyer story", "the DPF light"), or asks what to make next.
---

## Output

`projects/<slug>/brief.md` from `projects/_TEMPLATE/brief.md`. Slug = `<yyyy-mm>-<code-or-topic>-<hook>` (e.g. `2026-11-p0420-light-on`). Stop after the brief: the owner approves it before `/video-script`.

## Steps

1. **Facts first, from the web repo, never from memory.** `npm run facts -- code <CODE>` (title, severity, safe-to-drive note, summary, symptoms, repair cost rows, `last_updated`). If the command says there is no page, the code cannot be the subject: pick a code with a page or ask. `npm run facts -- prices "<repair>"` for the EUR range; `npm run facts -- capability "<feature>"` for anything the video shows the app doing. Quote the file path next to every claim.
2. **Scenario**: one owner, one car (one of the team's BMWs: E60 535d or E61 535), one moment (light comes on, buying a used car, before a long trip, after a cheap scan at a garage). The scenario is the hook, not the app.
3. **Hook archetype** (rotate; check the last 10 `projects/*/brief.md`): (a) the moment it happens, (b) the cost you fear vs the real range, (c) "is it safe to drive" as a question, (d) the used-car trap, (e) the garage quote second opinion, (f) myth vs reading. Write the spoken hook (complete by 3.0 s) and the on-screen hook text (at most 7 words).
4. **Three answers** in owner words: what it means (one sentence), can I drive (the app's severity and its note, worded as the app's guidance), what it costs (range, "roughly", EUR).
5. **App flow** the recording needs: screens in order (connect, scan, code card, severity, cost), the demo vehicle = the filmed car, which taps get rings. Name the capture flow id for the app repo.
6. **Shot list** from `docs/shooting-guide.md` (minimum 1-3-5-6-7-12) with the location and light (blue hour?).
7. **Claims table**: every number and capability, its source path, who signs it off.
8. **Variation check**: car angle, location, archetype, structure differ from the last 10 briefs.
9. **Disclosure line**: the per-platform toggles from `docs/disclosure.md`, and whether a "Demo data" or "Sequences shortened" note is needed.

## Rules that cannot be argued with

- Claims only from `CAPABILITY_GROUND_TRUTH.md`, `REPAIR_PRICES.md`, `data/dtc-codes/*.json`, `data/dtc-stats.json` (paths in `scripts/facts.ts`). No competitor claim without `COMPETITOR_PRICES.md`.
- "Free on iOS and Android", adapter note, Pro never implied free, never "Wi-Fi adapter".
- No stock footage, no AI imagery, no invented testimonial, no "we see most often" authority the team cannot stand behind.
