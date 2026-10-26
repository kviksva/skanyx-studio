# Disclosure, badges, claims: what every post must carry

Research and sources: `docs/research/04-disclosure-legal.md` (platform rules read 2026-10-26, EU AI Act Art 50 as applicable since 2026-08-02, Apple and Google marketing rules, ElevenLabs terms). This file is the operating rule set. Rules marked LAWYER are provisional until the six questions in research 04 section 10 are answered.

## Per platform, every post

| Platform | Always (own-brand promo) | Because the voice is AI |
|---|---|---|
| TikTok | "Disclose commercial content" > **Your brand** (Community Guidelines effective 2026-09-24) | Tick the **AI-generated content** label (the rule names "realistic" scenes and people; audio is unclear; the label is cheap, removal is not) |
| Instagram + Facebook Reels | nothing (Paid partnership is for third parties) | **AI label on** (Meta: "realistic-sounding audio that was digitally created", no own-voice carve-out) |
| YouTube Shorts | nothing for own brand on own channel (verify once in Studio) | **Altered or synthetic content = Yes** (description label; YouTube says no reach effect) |

Not disclosure triggers: real B-roll, the real app recording, Remotion graphics and captions, an AI-drafted script ("production assistance"), audio clean-up.

**Burned-in mark.** `EndCard` has `aiVoiceMark` (small "Voice generated with AI"). Default OFF until the lawyer answers Q1 (is a stock synthetic narrator a "deep fake" under Art 50(4)). If the answer is yes, the Code of Practice wants the mark at the start and repeated, not only on the end card: then add it to the hook slot too. LAWYER.

**ElevenLabs output is watermarked** (inaudible, checkable with their Audio Detector by anyone with a free account). Never strip provenance; never claim the voice is human.

## Store badges and device frames (Apple, Google)

- End card: **one static black App Store badge, first (left)**, Google Play badge at the **same height**, neither animated, Apple badge at least 40 px with clear space of a quarter of its height, Play badge at least 28 px, unaltered. Localised artwork per language (English for now).
- Credit lines in small type on the end card: "Apple, the Apple logo and App Store are trademarks of Apple Inc." and "Google Play and the Google Play logo are trademarks of Google LLC." (`EndCard` prints both.)
- iPhone frame: Apple's official bezel for a current device, straight-on, never tilted, spun, 3D-rotated or animated; never an Android phone in the same frame as an iPhone; the full status bar as the recording shows it (9:41, full bars).
- Sped-up app footage: "Sequences shortened" on screen (Apple).
- Wording: "Free on iOS and Android" is the house claim (web CLAUDE.md). On-screen graphics may say "Android"; Google asks for brand review of creatives that do (owner decision 9 in research 04, open). "Works with a Bluetooth ELM327 OBD2 adapter": never "Wi-Fi" (unsupported since 2026-07-02).

## Claims (EU consumer law, UCPD)

- Everything shown exists in the app: features from `CAPABILITY_GROUND_TRUTH.md`, screens from a real recording.
- A cut from "adapter goes into this car" to a screen must not imply a reading that did not happen: the demo vehicle in the recording matches the filmed car, or the frame carries a small "Demo data" note.
- "Safe to drive" is worded as the app's per-code guidance ("Skanyx rates P0420 as safe to keep driving for now"), never as a verdict on the filmed car or on the viewer's car.
- Prices: ranges, "roughly", from `REPAIR_PRICES.md` or the code file, EUR. Never a $ or GBP figure relabelled.
- "Free" always stands next to the adapter note; Pro is optional and never implied free.
- A named person signs off every script's claims (`review.md`: "Claims signed off by: ..."); `npm run qa` fails without it. Keep the log: it is the substantiation file.

## Car makes and badges

- Incidental BMW badges on our own cars are fine. No roundel as thumbnail or hero, no BMW logo in graphics, no "BMW app" wording. "Not affiliated with BMW AG" on screen when a make is central. Blur third-party plates and faces.

## Music

- Eleven Music is "individual use only" below the Scale plan: not usable for Skanyx today. Licensed stock or owned music only; the licence URL goes into `manifests/media.jsonl`. YouTube: "AI generated music" would need the altered-content disclosure.
- Business accounts on TikTok are limited to the Commercial Music Library; a TikTok-only edit may use CML sounds.

## Boosting

- Boosting a post makes it an ad and pulls in ad policies (TikTok reportedly requires AIGC labels in ads since 2026-07-21; Meta shows AI info under "About this ad"). Decide before the first boost.

## Attribution links

- Bio links: `skanyx.com/get?utm_source=<platform>` (a page), never `/api/go/app` directly: the hop logs but does not count a click with a foreign or missing referer. A `social_*` exemption is a later web-repo change.
