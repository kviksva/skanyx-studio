---
name: video-script
description: Write projects/<slug>/script.json from an approved brief - display and spoken tracks per line, delivery tags, timing targets - then check every claim against the web repo and every sentence against the last 10 scripts, and prepare the voice run.
when_to_use: Use after the owner approved a brief, or when revising a script after the listening pass.
---

## Output

`projects/<slug>/script.json` (schema: `scriptSchema` in `scripts/voice/tts.ts`; example in `projects/_TEMPLATE/script.json`) plus the Claims section of `review.md` filled in with the source path per claim, ready for a named person to sign.

## Writing

1. Read `docs/style-guide.md` (hook, body, voice sections) and `docs/voice-guide.md` ("Writing for the ear").
2. One beat per line, `scene` names the visual it sits on (`hook`, `plug`, `scan`, `meaning`, `verdict`, `cost`, `cta`). About 70-80 spoken words for 30 s; hook complete by 3.0 s (about 7-8 words).
3. `display` = captions (code as written, "€300 to €900", one `*emphasised*` word at most). `spoken` = the words read aloud: codes character by character ("P zero four two zero"), numbers and currency in words, acronyms the dictionary does not cover spaced out. Never send `display` to the voice.
4. At most two delivery `tag`s in the whole script, voice quality only.
5. The sign-off line is the one sentence allowed to repeat across videos. Keep it to "Skanyx is free on iOS and Android." or a sanctioned variant.

## Checks (run them, print the result)

- **Claims**: for every number or capability in `display`/`spoken`, re-run `npm run facts -- ...` and record the path in `review.md`. A claim with no path is cut.
- **Repeat check**: for each sentence in `spoken`, grep the last 10 `projects/*/script.json`; a hit other than the sign-off is rewritten.
- **Phrase tics**: none of "in today's video", "let's dive in", "game-changer", "the honest answer", "genuinely", "Here's the thing".
- **Read aloud** the spoken track once yourself (silently is not reading aloud: have the owner or a teammate read it).

## Then

Tell the owner the voice run command: `npm run voice:tts -- projects/<slug>/script.json --takes 2`. Do not run it yourself unless asked (it spends credits).
