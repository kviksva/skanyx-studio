# Style guide: hook, pacing, captions, voice, motion

The rules every Skanyx short follows. Numbers are encoded in `src/brand/*` and `src/lib/safe-zones.ts`; this file says why. Research behind each rule: `docs/research/03-shortform-craft.md` (craft), `01-remotion.md` (motion), `02-voice-audio.md` (voice).

## The format

One problem per video, 20-40 s (target 25-35), 1080x1920, 30 fps constant. Real car, real app, real hands. The viewer gets three answers in three beats: **what the light means, can I drive, roughly what it costs.** The app is the hero, shown doing the scan, not described.

## Hook (0-3 s)

1. **Frame 0 shows the problem**, real: the light on a real dashboard, the chime audible. It is also the cover, so it sits inside the 3:4 grid crop (y 240-1680) and the union safe rectangle. No logo, no black, no fade in.
2. **The spoken hook is complete by 3.0 s**, uses "you" or the viewer's exact situation, and states or implies the value promise.
3. **The code and plain-language topic appear in the first 3 s** in voice, on screen and in the post caption. Speech and on-screen text are indexed.
4. Rotate the six hook archetypes (brief skill lists them); never the same archetype twice in a row on one account.
5. No alarm-type sound in the first 3 s (TikTok guidance): a dashboard chime is fine, soft and short.

## Body (3 s to the end card)

6. **The app is on screen by 5-8 s**, doing the scan on the filmed car. Every screen shown is one the app really produces (`CAPABILITY_GROUND_TRUTH.md`).
7. **Three answers, three beats**, each its own visual: meaning (CodeChip + one sentence), verdict (SeverityBar, the app's per-code guidance, never a verdict on the filmed car), cost (CostRange, "roughly", a range from `REPAIR_PRICES.md` or the code's `repair_costs`).
8. **New visual every 1.5-3 s; nothing static longer than 3 s** except the verdict hold (max 2.5 s). A pattern interrupt (angle change, punch-in, sound cue) every 3-5 s. No cut without a reason.
9. **Every key fact is both heard and read.** The video works muted and works eyes-off.
10. **Loop by design:** the last line and shot resolve into the opening frame.
11. **End card** last 2-3 s: wordmark, exactly "Free on iOS and Android", adapter note, both store badges (`EndCard`), all inside the safe rectangle.

## Captions

12. Phrase-based from the voice alignment (`captionsFromWords` + `pageWords`), never word-by-word pops.
13. At most 2 lines, about 28 characters per line, at most 17 characters per second, at least 0.8 s on screen, Netflix break rules (break after punctuation, before a conjunction, no orphan word).
14. Geist 64 px, floor 52 px, sentence case, solid obsidian plate at 85% or more, contrast at least 4.5:1. **At most one emphasised word** per page (`*word*` in the display track renders amber). No emoji.
15. Captions live in the caption slot (y 1000-1240). Hook text in the hook slot (y 300-560, at most 7 words, 80-110 px).

## Voice

16. AI narrator (ElevenLabs, owner decision 2026-10-26). Scripts are written for the ear: short sentences, contractions, the number said the way a person says it. Two tracks per line: `display` and `spoken`. Details in `docs/voice-guide.md`.
17. No sentence except the sign-off may repeat across more than a few videos. No "3 reasons why" list shape by default. No chatbot phrasing ("in today's video", "let's dive in", "game-changer").
18. Pronunciation: "Skanyx" is SKAN-iks. Codes are read character by character ("P zero four two zero").

## Motion

19. Named tokens only (`src/brand/motion.ts`): `enter` 350 ms with the enter curve, `exit` 200 ms, `move` 450 ms, `settle` spring (damping 200, no bounce). No bouncy default spring, no ripple, light leak or whip transitions, no "AI slideshow" zoom-in on every shot.
20. Hard cuts on voice beats. Cross-fades only where two shots share a subject.
21. **The iPhone frame is never tilted, spun or 3D-rotated** (Apple marketing rules). Animate the camera (pan or zoom after an establishing shot), not the device. The app recording is never graded, scaled below 1:1 of its pixels or speed-changed without "Sequences shortened" on screen.
22. Animate only what explains: the severity bar filling, the cost range extending, a tap ring on the real tap. Nothing animates for decoration.
23. Design and polish questions go to the `apple-design` and `emil-design-eng` skills (symlinked in `.claude/skills/`), then the motion tokens above.

## Colour and type

24. Brand gold `#D4A054`, surfaces obsidian/carbon/graphite (`src/brand/tokens.ts`). `status.*` colours only for the safe-to-drive verdict and data, never decoration.
25. One typeface, Geist (Geist Mono for codes). No drop shadows on type; a plate instead.

## Footage

26. All B-roll team-filmed on the team's own cars for this video, or not reused within the last ~10 videos. No stock footage, no AI imagery, no gibberish text in frame. `docs/shooting-guide.md` has the camera settings and shot list.
27. Music is a bed, never the hook; low under the VO, rotated between videos. Until a licensed source is chosen the slot ships empty and diegetic car sound carries the video.

## Post copy

28. A plain sentence with the code and the symptom, no links, sentence case, at most 5 hashtags, no "link in bio" spam. Disclosure settings per `docs/disclosure.md`.

## Variation (one template, many codes)

29. Across the last 10 posts on an account: different car angle or location, hook archetype, structure variant, music bed, and no shared sentence except the sign-off. `/video-script` checks the last 10 `projects/*/script.json` for repeated sentences.
