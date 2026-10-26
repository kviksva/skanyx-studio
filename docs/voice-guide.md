# Voice guide: ElevenLabs narrator, scripts for the ear, dictionaries, listening

Owner decisions 2026-10-26: AI voice (ElevenLabs) for all videos, English only for now, "Skanyx" = SKAN-iks /ˈskænɪks/. Research and sources: `docs/research/02-voice-audio.md`.

## The narrator

- One English Voice Library voice, chosen **blind** from a listen set: `npm run voice:listen-set -- search` shortlists professional voice-actor clones (Studio quality, notice period at least a year, no live moderation, never Brian, Liam, Adam, Jessica, Matilda or Sarah), `render` writes `media/vo/_listen-set/candidate-N.wav` with the same five-line test and the key in `KEY.json`. The owner listens without the key and picks.
- Record the pick here and in `.env` (`ELEVENLABS_VOICE_ID`):

| Date | Candidate | Voice id | Notes |
|---|---|---|---|
| (pending) | | | |

- Re-audition only if the voice is retired by its owner (watch the notice period) or a second language is added.

## Model and request

`eleven_v4`, `POST /v1/text-to-speech/{voice}/with-timestamps`, `language_code: "en"`, PCM 48 kHz converted to 24-bit WAV, `apply_text_normalization: "off"`, `previous_request_ids` of the last three lines (so prosody carries across lines; ids expire after two hours, so one video's lines are generated in one session), pronunciation dictionary pinned by `version_id`. `scripts/voice/tts.ts` does all of it and caches by content hash, so a re-run spends nothing on an unchanged line.

Settings: stability 0.45, similarity 0.75, no style (v4 has none), no speed (v4 has none), `seed` only to audition takes (`--takes 3`). v4 output is not reproducible: **the approved WAV is the master**; it lives on the SSD under `media/vo/<slug>/` and its hash in `projects/<slug>/vo.json`.

Fallback per project: `voice.modelId: "eleven_multilingual_v2"` in `script.json` if v4's delivery disappoints (it has `<break>` and speed, no IPA rules outside English).

## Writing for the ear

- One beat per line (`lines[]` in `script.json`): a sentence or two, 2.3-2.7 words a second, so a 30 s video has about 70-80 spoken words. The gap between lines is set in the timeline (120-450 ms by meaning), never with a tag.
- Two tracks per line. `display` is what captions show ("P0420", "€300 to €900"). `spoken` is what the voice reads: "P zero four two zero", "three hundred to nine hundred euros". Never send `display` to TTS. Letters that could be read as a word are spaced ("O B D two" is in the dictionary; a new acronym goes there too).
- Punctuation is the pacing tool: a comma is a breath, a full stop a beat, an ellipsis a pause with weight. Capitals add emphasis sparingly.
- At most 1-2 delivery tags per video, describing voice quality: `[calm, reassuring]`, `[low, unhurried]`. Never a sound-cue tag (v4 may render it as a sound effect). Put the tag in `tag`, not inside `spoken`.
- If a take runs long, cut words. Never time-stretch beyond about 5%.
- No chatbot phrasing. Read every script aloud before generating.

## Pronunciation dictionary

`npm run voice:dictionaries` creates `skanyx-en` (Skanyx as /ˈskænɪks/ in three casings, aliases for OBD2, OBD-II, ELM327, PPI, DPF, EGR, ECU, VIN) and prints the two ids for `.env`. Edit `scripts/voice/dictionaries.ts` when a test take misreads something, re-run, pin the new version. Rules are case-sensitive and the first match wins.

## Listening protocol (every video)

1. Listen to each line once with eyes closed: a misread number, a wrong stress on the code, a swallowed word, a breath cut short at the end: regenerate that line (`--takes 3`, then pick in `vo.json`).
2. Listen to the assembled mix on phone speakers at normal volume and once on earbuds.
3. Never leave digital silence between lines: the bed or room tone runs. Breaths stay, lowered, never gated out.

## Mix

`npm run audio:mix` applies high-pass 80 Hz, a 2 dB cut at 300 Hz, de-esser, 3:1 compression on the VO; ducks the music 8-12 dB under it; two-pass `loudnorm` to -14 LUFS, -1.5 dBTP, LRA 7 in linear mode (the script refuses dynamic mode); writes `mix-report.json`. SFX come from the bank in `media/sfx/`.

## Account and key

A studio-scoped ElevenLabs key with a credit cap, separate from the app's voice-agent key (that key lives in the Supabase edge-functions container and must never be used here). Opt out of training in Data use. Commercial use needs a paid plan; keep the subscription active while any published video's voice was generated.
