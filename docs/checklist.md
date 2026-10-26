# Per-video checklist (all 20 must pass before publish)

`/video-review` walks this list, runs `npm run qa`, reads the contact sheet and writes the result into `projects/<slug>/review.md`. The owner approves the final render; a named person signs off the claims.

1. [ ] Frame 0 shows the real problem (no logo, no black, no fade) and works as the cover in the 3:4 crop (y 240-1680).
2. [ ] Spoken hook ends by 3.0 s; the code or topic is on screen and spoken in the first 3 s.
3. [ ] The real app is visible doing a real scan by about 8 s; every screen shown is something the app actually produces.
4. [ ] What it means, can I drive (severity colour), rough cost: all three answered, each as its own beat.
5. [ ] Every number traced to a source file (`REPAIR_PRICES.md`, `data/dtc-codes/<CODE>.json`, `data/dtc-stats.json`) and listed in `brief.md` under Claims; currency and number format correct.
6. [ ] No capability claim beyond `CAPABILITY_GROUND_TRUTH.md`; store wording exactly "Free on iOS and Android"; "free" qualified by the adapter note; "safe to drive" phrased as the app's per-code guidance, never as a verdict on the filmed car.
7. [ ] All text, logos and faces' eyes and mouths inside the union safe rectangle (x 120-880, y 288-1248); TikTok right rail (x > 880, y 840-1500) clear; checked with the Studio overlay on; final rendered with `overlay: "none"`.
8. [ ] Captions: phrase-based, at most 2 lines, about 28 chars per line, at most 17 cps, at least 0.8 s, at least 52 px, contrast at least 4.5:1, no orphan word, at most one emphasised word per page (`captions.json` lint clean).
9. [ ] No visual held longer than 3 s (verdict at most 2.5 s); a scene change at least every 3 s; total 20-40 s with no padding or recap.
10. [ ] Voice: the approved narrator, pronunciation dictionary applied, "Skanyx" as SKAN-iks, the code read character by character, no misread number, natural pacing, no digital silence between lines (bed or room tone runs).
11. [ ] All footage team-filmed for this video or not reused within the last ~10 videos; no stock, no AI imagery, no gibberish text in frame; the app recording's demo vehicle matches the filmed car or the frame carries "Demo data"; sped-up app footage carries "Sequences shortened".
12. [ ] Music, if any, licensed for business use on all four platforms and listed in `manifests/media.jsonl` with its licence; bed clearly below the VO. (Empty slot until a source is chosen.)
13. [ ] Script read aloud by a second person: no chatbot phrasing, no hook formula used in the last ~10 videos, no sentence copied from another video except the sign-off.
14. [ ] Muted test (story clear with sound off) and eyes-off test (story clear from the voice alone).
15. [ ] iPhone frame straight-on, Apple bezel artwork (QA warns on the CSS fallback), real store badges (QA warns on placeholders), credit lines present on the end card.
16. [ ] Loop check: the last 2 s lead back into frame 0; end card inside the safe rectangle.
17. [ ] Export check (`npm run qa` spec gate): 1080x1920, CFR 30 (or 25) fps, H.264 High yuv420p bt709, AAC 48 kHz stereo, -14 LUFS / -1.5 dBTP / LRA at most 7, no watermark.
18. [ ] Device check on one iPhone and one tall Android in the real app UI (private upload or Trial Reel): nothing important under the UI or cropped at the sides.
19. [ ] Post copy written in `publish.md`: code + symptom in a plain sentence, no links, at most 5 hashtags, and the disclosure toggles per `docs/disclosure.md` listed for each platform.
20. [ ] Variation check against the last 10 posts on the account: different car angle or location, hook archetype, structure variant and music bed; `/video-script` sentence-repeat check clean.

Sign-off lines `review.md` must carry (QA fails without the first):

```
Claims signed off by: <name>, <date>
Final render approved by: <name>, <date>
```
