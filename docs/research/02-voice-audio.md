# 02 - Voice and audio research (ElevenLabs, music/SFX, mixing)

Research date: 2026-10-26. Scope: voiceover, music, SFX and loudness for 20-40 s vertical Skanyx ads in 14 locales.
Status: COMPLETE (2026-10-26). Sections: Headline, Q1-Q7, Decisions for the studio, Uncertain / verify.

Sources were fetched live on 2026-10-26 unless a different date is given. ElevenLabs doc pages carry no per-page date; for those, "fetched 2026-10-26" is the date that applies, plus the changelog date when one exists. Raw copies of every ElevenLabs page used were saved under the session scratchpad and are NOT in the repo.

## Headline (read this first)

1. **Your premise is out of date: Eleven v3 is no longer the top model.** **Eleven v4** (`eleven_v4`) and **Eleven v4 Turbo** came out in the changelog of **2026-09-28**. ElevenLabs now calls v3 "our previous generation" model and "strongly recommend switching to v4". (Source: https://elevenlabs.io/docs/changelog/2026/9/28 ; https://elevenlabs.io/docs/overview/models)
2. **v4 is the only top-quality model that covers all 14 locales.** Multilingual v2 has no **lt, hu or sl**. Flash v2.5 has no **lt or sl**. v3 and v4 cover all 14.
3. **European Portuguese and Castilian Spanish are the main risk.** v4's own FAQ names its Portuguese as "Portuguese (Brazil)" and its Spanish as "Spanish (LatAm)". v4 also deliberately drops the reference voice's accent when it speaks another language. So a voice, or a PT-PT clone, does not guarantee a European-Portuguese accent on v4. Test before committing (see Uncertain / verify).
4. **v4 has no Style or Speed setting and no SSML** (no `<break>`, no `<phoneme>` tags). Pacing comes from punctuation, audio tags and how the script is written. Pronunciation is fixed with inline IPA (`"/.../"`) or with pronunciation-dictionary phoneme or alias rules.

---

## Q1. Models (as of 2026-10-26)

### Current lineup
Source: https://elevenlabs.io/docs/overview/models (fetched 2026-10-26)

| Model ID | Status | Languages | Char limit / request | Notes |
|---|---|---|---|---|
| `eleven_v4` | **Current flagship, released 2026-09-28** (changelog), no alpha label | 90+ | 10,000 | "Most emotive, high quality". Audio tags yes. **No Style or Speed slider, no SSML.** Settings: Stability, Similarity, plus **Clone Strength** for PVCs. |
| `eleven_v4_turbo` | Current, real-time (~100 ms) | 90+ | n/a | Built for agents. Not the pick for ads. |
| `eleven_v3` | **Previous generation.** No longer labelled alpha in the model table; help pages still have "alpha" in their URL slugs | 70+ | 5,000 | Audio tags. **Request stitching NOT available on v3.** PVCs are "not fully optimized for Eleven v3". |
| `eleven_multilingual_v2` | Previous generation; "most stable on long-form" | 29 | 10,000 | Supports Style, Speed and speaker boost, plus `<break>` (this model is not covered by the v3/v4 no-SSML note). `language_code` is NOT supported. Pronunciation dictionaries: **alias rules only**, phoneme rules are skipped. |
| `eleven_flash_v2_5` | Low latency, half price on the API | 32 | 40,000 | Numbers are not normalised by default ("$1,000,000" can come out as "one thousand thousand dollars"). Wrong tool for ads. |
| `eleven_multilingual_sts_v2` | Voice changer (speech-to-speech) | 29 (same as Multilingual v2) | n/a | Used if a human VO is converted into another voice. |

- Changelog 2026-09-28: "Eleven v4 and Eleven v4 Turbo are now available ... more than 90 languages ... Use `eleven_v4` through the Text to Dialogue API for content creation." The Help Center adds that `eleven_v4` also works on the plain **Create speech / Stream speech** endpoints. (https://elevenlabs.io/docs/changelog/2026/9/28 ; https://elevenlabs.io/docs/help-center/product/core-capabilities/text-to-speech/what-is-eleven-v4)
- ElevenLabs on v4: "a net upgrade over Eleven v3, delivering better results in almost every case ... We strongly recommend switching to v4". They also warn: "Eleven v4 is under active, continuous development ... its behavior may shift over time ... We recommend periodically re-testing your use case." (https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4) **A model that keeps changing hurts reproducibility: a re-render months later may not match. Archive every rendered WAV; do not count on re-generating it.**
- Model selection guide: for "Content creation ... professional content, audiobooks & video narration", use `eleven_v4` or `eleven_multilingual_v2`. (https://elevenlabs.io/docs/overview/models#model-selection-guide)
- Voice Design voices "work with Eleven v4, but they may not be as performative or sound as good as with earlier models." (v4 FAQ, same URL)

### Coverage of the 14 Skanyx locales

| Locale | v4 | v3 | Multilingual v2 | Flash v2.5 | Forced Alignment API |
|---|---|---|---|---|---|
| en | yes | yes | yes (US/UK/AU/CA) | yes | yes |
| de | yes | yes | yes | yes | yes |
| es | yes, **listed as "Spanish (LatAm)"** | yes | yes (Spain, Mexico) | yes | yes |
| pl | yes | yes | yes | yes | yes |
| **lt** | yes | yes | **NO** | **NO** | **NO** |
| fr | yes | yes | yes (France, Canada) | yes | yes |
| it | yes | yes | yes | yes | yes |
| nl | yes | yes | yes | yes | yes |
| **pt (PT-PT)** | yes, **listed as "Portuguese (Brazil)"** | yes ("pt") | yes ("Brazil, Portugal") | yes | yes |
| tr | yes | yes | yes | yes | yes |
| **hu** | yes | yes | **NO** | yes | **NO** |
| uk | yes | yes | yes | yes | yes |
| **sl** | yes | yes | **NO** | **NO** | **NO** |
| ro | yes | yes | yes | yes | yes |

Sources: https://elevenlabs.io/docs/overview/models ; https://elevenlabs.io/docs/help-center/other/what-languages-do-you-support ; https://elevenlabs.io/docs/overview/capabilities/forced-alignment (all fetched 2026-10-26). The v4 FAQ language list names "Portuguese (Brazil)" and "Spanish (LatAm)" (https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4#faq). The `language_code` table for the same model just says `pt` / `es`.

### European Portuguese vs Brazilian (and Castilian vs LatAm Spanish)
- **How the older models work:** "The language is determined by the text, while the accent and pronunciation are determined by the voice itself." To get the right accent, "use a cloned voice that was cloned speaking the language with the correct accent." (https://elevenlabs.io/docs/help-center/product/core-capabilities/text-to-speech/what-languages-can-the-ai-speak). On Multilingual v2 and v3, a **native PT-PT voice** (from the Voice Library or a PT-PT clone) is therefore the lever.
- **v4 changes this:** "When the language you're generating matches the language of your reference voice, the original accent is preserved exactly as before. When the language ... is different ... Eleven v4 generates fluent, natural-sounding speech in the target language — rather than carrying over the reference voice's accent." This is always on: ElevenLabs is "exploring ways to make it a toggle" but has given no timeline. (v4 page, fetched 2026-10-26)
  - So **a native PT-PT voice generating Portuguese should keep its PT-PT accent**, because the source language and the output language match. An **English** voice generating Portuguese, by contrast, will most likely come out with the model's default accent, which the FAQ suggests is Brazilian.
  - **Unverified:** whether ElevenLabs treats a PT-PT voice and pt text as "the same language", and so keeps the accent. They should, since both are `pt`, but nothing in the docs states it. Same question for Castilian Spanish. **This must be ear-tested by a native speaker before the studio commits** (see Uncertain / verify).
- Audio tags such as `[European Portuguese accent]` are "experimental", and "results may vary". Do not use them in production. (best-practices page)
- The Voice Library can be filtered by **language and then accent** ("When you select a language, the Accent filter will also become available", https://elevenlabs.io/docs/eleven-creative/voices/voice-library, fetched 2026-10-26). Third-party directories list ElevenLabs Library voices tagged "European" Portuguese, e.g. "Joana" (https://json2video.com/ai-voices/languages/portuguese/portugal/, fetched 2026-10-26; the voice names were not verified in the Library itself). ElevenLabs publishes no guidance on PT-PT vs PT-BR model behaviour; I searched on 2026-10-26 and found none.
- **The same trap exists in the Skanyx web repo:** `CLAUDE.md` notes that Google Play serves `hl=pt` as the Brazilian listing. Treat "pt" as Brazilian by default everywhere unless proven otherwise.

### Which model gives the most natural ad/explainer narration?
- **ElevenLabs' view:** v4 for quality ("highest-quality ... content creation"). Multilingual v2 is the "most stable on long-form" fallback, and it alone keeps Style, Speed and `<break>`. (models page)
- **For 20-40 s ads in 14 languages:** v4 is the only top-tier model that speaks lt, sl and hu, and the only one that applies pronunciation-dictionary **phoneme** rules outside English ("If you want to use IPA and CMU pronunciations in languages other than English, you will have to switch to the eleven_v4 model", https://elevenlabs.io/docs/eleven-api/guides/how-to/text-to-speech/pronunciation-dictionaries).
- **Practitioner reports** are in Q4.

---

## Q2. Official prompting and best-practice guidance

Main sources (all fetched 2026-10-26):
- Best practices: https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices
- TTS playground (voice settings): https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech
- API reference: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
- Request stitching: https://elevenlabs.io/docs/eleven-api/guides/how-to/text-to-speech/request-stitching
- Pronunciation dictionaries: https://elevenlabs.io/docs/eleven-api/guides/how-to/text-to-speech/pronunciation-dictionaries and https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/create-from-rules

### Audio tags (v4 and v3)
- Syntax: an instruction in square brackets, placed where the delivery should change. Documented examples: `[whispers]`, `[sighs]`, `[exhales]`, `[curious]`, `[excited]`, `[sarcastic]`, `[laughs]`, `[clears throat]`, `[short pause]`, `[long pause]`, plus free-form direction such as `[Quiet, reflective narration]` or `[Warm, conversational tone, faint amusement]`.
- v4 warning: "Because Eleven v4 is trained to generate both vocal delivery styles and sound effects, a tag can occasionally be interpreted as a request for a sound effect rather than a delivery instruction". Describe the *voice quality* (e.g. `[low, gravelly voice]`), not a sound cue.
- "Tags land more readily when the delivery is already in the voice's training data." A calm narrator voice should get calm tags; "A serious, professional voice may not respond well to playful tags like `[giggles]`."
- Tags are "not perfect yet". ElevenLabs is still improving how reliably the model follows them.
- **Studio rule for ads:** use at most 1-2 *delivery* tags per spot (e.g. `[calm, reassuring]` at the "the app tells you" turn). Never use a sound-effect tag, because SFX go in the mix, not the voice track. Tags are written in English even when the script is not. The docs show only English tags, so whether non-English tags work is **unverified**.

### Punctuation and pauses
- v4/v3: "**Eleven v4 and Eleven v3 do not support SSML break tags.** Use audio tags, punctuation (ellipses), and text structure to control pauses and pacing." "Ellipses (...) add pauses and weight", "Capitalization increases emphasis", "Text structure strongly influences output with v4".
- Multilingual v2 / Flash: `<break time="1.5s" />`, up to 3 s, "the model understands the syntax and adds a natural pause". "Too many break tags ... can cause instability. The AI might speed up, or introduce additional noises".
- **Studio rule:** with v4, generate **one sentence (or beat) per request** and set exact gaps in the timeline (Remotion/ffmpeg), not with tags. Ad timing has to land on cuts, and only the editor can place a pause exactly.

### Speed and pacing
- `speed` 0.7-1.2 exists for Multilingual v2 / Flash ("Extreme values may affect the quality"). "**Speed is not available for the Eleven v3 model**" and "**Style and Speed sliders are not available in Eleven v4**".
- "The pacing of the audio is highly influenced by the audio used to create the voice." So pick a voice whose natural pace fits 20-40 s spots. For a 25-30 s spot that is about 2.3-2.7 words/s in English (industry rule of thumb, not an ElevenLabs figure).
- If a v4 take is slightly long, fix the script (cut words), not the tempo. Small ffmpeg `atempo` changes (about ±5%) are generally inaudible; beyond that, artefacts appear (general audio practice, not ElevenLabs guidance).

### Voice settings
| Setting | Range / default (API) | Applies to | Guidance (quoted) |
|---|---|---|---|
| `stability` | 0-1, default 0.5 | all incl. v4 | "Lower values introduce broader emotional range ... Higher values can result in a monotonous voice." "For a more lively and dramatic performance ... set the stability slider lower and generate a few times." |
| `similarity_boost` | 0-1, default 0.75 | v2, v4 ("Similarity"); "Similarity is not available for the Eleven v3 model" | "If the original audio is of poor quality and the similarity slider is set too high, the AI may reproduce artifacts". v4: "Higher values enforce closer adherence to the reference, which can come at the cost of some naturalness." |
| `style` | 0-1, default 0 | v2 only (not v3, not v4) | "**In general, we recommend keeping this setting at 0 at all times.**" Makes the model "slightly less stable". |
| `use_speaker_boost` | bool, default true | v2 (not v3) | "differences ... generally rather subtle". |
| `speed` | 0.7-1.2, default 1.0 | v2/Flash only | see above |
| `clone_strength` | 0-1 | **v4 + PVC fine-tuned for v4 only** | "We recommend 0 for most use cases." Lower means "smoothed slightly and the delivery gains more performance flexibility, which often sounds better overall". |

- Playground default advice: "stability around 50, similarity around 75, and keeping style at 0, with minimal changes thereafter."

### `seed` (reproducibility)
- `seed`: integer 0-4294967295; "best effort to sample deterministically ... **Determinism is not guaranteed**." The FAQ says: "The models are nondeterministic. For consistency, use the optional seed parameter, though subtle differences may still occur."
- On top of that, v4 itself keeps changing ("its behavior may shift over time").
- **Studio rule:** treat a seed as a way to *audition variants*, not as a rebuild guarantee. The approved WAV is the master artefact; commit its hash and keep the file in storage.
- Free regenerations: "You can regenerate each piece of content up to 2 times for free" if text and settings are identical (TTS FAQ). That applies to website generations; whether API calls get it is **unverified**.

### Request stitching (prosody across segments)
- Parameters on `/v1/text-to-speech/{voice_id}` and the timestamp variants: `previous_text`, `next_text`, `previous_request_ids` (max 3), `next_request_ids` (max 3). If both text and IDs are sent, the text is ignored. Request IDs must be "no older than two hours". The ID comes from the `request-id` response header. Available on every plan, except for Enterprise zero-retention users.
- "**Request stitching is not available for the `eleven_v3` model.**" The official stitching example uses `model_id="eleven_v4"`, so v4 is the supported path (stitching guide, fetched 2026-10-26).
- The Text to Dialogue endpoint got continuity parameters on 2026-09-28: `previous_text` / `future_text` (**max 100 chars**), `previous_request_ids` / `next_request_ids` (max 3), all "Not supported by every model". (https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert-with-timestamps)
- "next_request_ids is especially useful ... when regenerating a sample that has had some audio quality issues". This is exactly the "fix line 3 of 6" case.
- **Studio rule:** generate line N with `previous_request_ids=[N-1, N-2, N-3]`. When re-rendering one line, pass both the previous and the next IDs. Because of the 2-hour expiry, a whole spot (all lines, one locale) must be rendered in one session.

### Text normalisation (numbers, codes like P0420, currency)
- `apply_text_normalization`: `auto` (default) | `on` | `off`. `language_code` (ISO 639-1) "used to enforce a language for the model and text normalization ... **not supported for multilingual_v2 models**."
- The official FAQ advice: "For the best results, we recommend writing numbers, acronyms, dates and symbols fully, in words, in the way that you would like the AI to deliver them." "11" can be "Eleven", "Once" or "Elf" depending on the language. (https://elevenlabs.io/docs/help-center/product/core-capabilities/text-to-speech/why-are-numbers-dates-symbols-and-acronyms-not-properly-pronounced-or-spoken-in-the-correct-language)
- Flash v2.5: normalisation is off by default; Enterprise only can turn it on. Multilingual v2 "does a better job of normalizing numbers". (models page)
- **Studio rule:** the script has two tracks: `display` (on-screen: "P0420", "€79.99") and `spoken` (per-locale words, written and checked by the native translator, e.g. de "P null vier zwei null", "neunundsiebzig Euro neunundneunzig"). Send only `spoken` to ElevenLabs, with `language_code` set and `apply_text_normalization: "off"`, so the model has nothing left to guess. **Unverified:** the docs give no recommended setting for pre-written text; "off" is my reasoning, so A/B it against "auto" once.

### Pronunciation dictionaries: alias vs phoneme, and which models apply them
- Two rule types (API `add-from-rules`):
  - **alias**: `{"string_to_replace": "Skanyx", "type": "alias", "alias": "Skan-ix", "case_sensitive": true, "word_boundaries": true}`. Works on **all** models.
  - **phoneme**: `{"string_to_replace": "Skanyx", "type": "phoneme", "phoneme": "ˈskænɪks", "alphabet": "ipa"}` (or `cmu-arpabet`).
- "**Pronunciation dictionary phoneme tags only work with eleven_v4, eleven_flash_v2 and eleven_v3 models.** Other models skip dictionary phoneme tags ... use alias tags instead." "**If you want to use IPA and CMU pronunciations in languages other than English, you will have to switch to the eleven_v4 model.**"
- Matching: "searches are case sensitive" (PLS); "the dictionary is checked from start to end and only the very first replacement is used". Up to **3 dictionary locators per request**, applied in order. A locator can pin a `version_id`, which is good for reproducibility.
- v4 also accepts **inline IPA** wrapped in slashes and quotes: `'The term "/ˌbaɪoʊˈkemɪstri/" ...'`. "IPA pronunciation is more consistent than in previous models, but results can still vary by voice and phrase ... generate more than once and select the best result."
- SSML `<phoneme>` inline tags: "only compatible with the `eleven_flash_v2` model". Irrelevant here.

---

## Q3. Timestamps

### TTS `with-timestamps`
- Endpoint: `POST /v1/text-to-speech/{voice_id}/with-timestamps`, plus a streaming twin `/stream/with-timestamps`. Body is the same as plain TTS (`text`, `model_id`, `language_code`, `voice_settings`, `pronunciation_dictionary_locators`, `seed`, `previous_*`/`next_*`, `apply_text_normalization`, `audio_effects`); `output_format` is a query param. (https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps, fetched 2026-10-26)
- Response (JSON, not raw audio):
  ```json
  {
    "audio_base64": "...",
    "alignment": {
      "characters": ["H","e","l","l","o"],
      "character_start_times_seconds": [0, 0.1, ...],
      "character_end_times_seconds":   [0.1, 0.2, ...]
    },
    "normalized_alignment": { "characters": [...], "character_start_times_seconds": [...], "character_end_times_seconds": [...] }
  }
  ```
  - `alignment` = "Timestamp information for each character in the **original** text"; `normalized_alignment` = "... in the **normalized** text" (e.g. after "€79.99" was expanded). Both are nullable.
  - Timings are per **character**, not per word. Group them into words yourself by splitting on spaces in `characters`.
- **Which models:** the reference lists no restriction on `model_id` (default `eleven_multilingual_v2`). I found no ElevenLabs statement that v4 is excluded, and none that it is included. **Verify with one v4 call before building on it** (Uncertain / verify).
- Text to Dialogue has its own `/v1/text-to-dialogue/with-timestamps` (default model `eleven_v3`, accepts v4). It returns the same `alignment` / `normalized_alignment` plus `voice_segments[]` (`voice_id`, `start_time_seconds`, `end_time_seconds`, `character_start_index`, `character_end_index`, `dialogue_input_index`). Keep total input at or under 2,000 chars per request. (https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert-with-timestamps)
- **Use in the studio:** with the per-line rendering in Q2, each line's alignment gives exact word in/out points for (a) kinetic captions in Remotion and (b) snapping cuts to stressed words. If text normalisation is off and the `spoken` text is pre-written, `alignment` and `normalized_alignment` should be identical. If they differ, the model rewrote something, and that is a QA flag.
- **Unverified:** how alias pronunciation-dictionary replacements show up in `alignment` (original grapheme vs alias). Test it.

### Forced Alignment API (human recording + script)
- `POST /v1/forced-alignment`, multipart: `file` (audio, < 1 GB per the API reference; the overview page says 3 GB / 10 h) + `text` (plain string, "diarization is not supported"). Response: `characters[]` {text,start,end}, `words[]` {text,start,end,loss}, `loss` (overall confidence). Priced "Same rate as the Speech to Text API". (https://elevenlabs.io/docs/api-reference/forced-alignment/create ; https://elevenlabs.io/docs/overview/capabilities/forced-alignment)
- **Languages: the 29 Multilingual v2 languages only**, so **no lt, hu, sl**. (overview page, fetched 2026-10-26)
- For lt/hu/sl human recordings: use **Scribe v2** speech-to-text, which returns word-level timestamps for 90+ languages. ElevenLabs' own accuracy table rates Hungarian "Excellent (≤5% WER)" and Lithuanian and Slovenian "High Accuracy (>5% to ≤10% WER)". Its "keyterm prompting, up to 1000 terms" can bias it toward "Skanyx", "OBD2" and the like (extra cost). (https://elevenlabs.io/docs/overview/capabilities/speech-to-text)
- Open-source alternatives (no ElevenLabs dependency): WhisperX or the Montreal Forced Aligner. Not researched in depth here.

### Extra use: an ASR round-trip check for QA
Run every rendered VO back through Scribe v2 and diff the transcript against the `spoken` script. This cheaply catches wrong digits in fault codes and prices, a model drifting into a neighbouring language (the help center warns that non-native voices "might drift in and out of similar languages", https://elevenlabs.io/docs/help-center/product/core-capabilities/text-to-speech/what-languages-can-the-ai-speak), and words dropped or added by audio tags. It does NOT catch a wrong accent (PT-BR vs PT-PT): that needs a native ear.

---

## Q4. Voice strategy for "does not sound AI"

### Route-by-route facts (ElevenLabs docs, fetched 2026-10-26)

**Voice Library** (https://elevenlabs.io/docs/eleven-creative/voices/voice-library ; help pages under https://elevenlabs.io/docs/help-center/product/voices/voice-library)
- "10,000+ community-shared voices". Filter by language, then accent, plus gender, age, use case, notice period, Live Moderation and custom rate. A "Studio Quality" label means a voice is "recorded with proper equipment ... reviewed by our QA testers".
- Many Library voices are **PVCs of real voice actors**, so the source performance is human. "voices tagged with a specific language will perform best in that language."
- Not available via API on the Free tier.
- **Withdrawal risk:** owners can stop sharing. With a notice period (minimum 30 days, maximum 2 years) you keep access until it ends; without one, access ends "immediately". Watch for this with `disable_at_unix` on `GET /v1/voices/{id}`, or with a webhook. **Audio already generated stays usable:** "Outputs generated using your User Voice Model prior to the end of the Notice Period will continue to exist and remain available for use thereafter." (Voice Library Addendum, last updated 2026-03-06, https://elevenlabs.io/vla)
- Some voices carry a credit multiplier (a legacy custom rate), so check for it before you pick one.
- **The most recognisable "AI voices" are the default social voices.** ElevenLabs itself lists its most popular social-media voices as **Brian, Liam, Adam, Jessica, Matilda, Sarah** (https://elevenlabs.io/docs/help-center/product/voices/voice-library/what-voices-are-popular-on-tik-tok-you-tube-and-social-media). **Studio rule: never use these.** They are the ones TikTok viewers have heard thousands of times. (This is my inference from their popularity; I found no listener study.)

**Voice Design** (https://elevenlabs.io/docs/eleven-creative/voices/voice-design)
- Generates 3 options from a prompt. The prompt template starts "Native <Language>. <Gender>, <Age range>. <Quality level>." The official example asks for "español europeo (sin rasgos de español latinoamericano)", so a European Spanish or European Portuguese voice *can* be requested explicitly.
- Tips: "Be explicit about language and dialect ... in the first sentence to prevent drift"; "Avoid FX words"; add "studio-quality recording".
- **Against it:** "Voice Design voices work with Eleven v4, but they may not be as performative or sound as good as with earlier models." (v4 FAQ). A designed voice has no human behind it. Use it only to fill a locale gap.

**Instant Voice Clone (IVC)** (https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/instant-voice-cloning ; https://elevenlabs.io/docs/eleven-api/concepts/voice-cloning)
- 1-2 minutes of clean audio ("Avoid recording more than 3 minutes ... can ... even be detrimental"). No training step. Plan: Starter and above ("Cloning is only available on the Starter tier and above", billing page).
- Consent: "confirm that you have the right and consent to clone the voice".
- "IVC clones can be less consistent when asked to produce speech that differs substantially from the reference material."
- v4: "Instant Voice Cloning has received a significant upgrade in Eleven v4" ... it "captures ... EQ, quality, volume ... plosives, harsh sibilance, and volume fluctuation" of the source. **On v4 the recording quality of the sample becomes the quality ceiling.**

**Professional Voice Clone (PVC)** (https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/professional-voice-cloning)
- Fine-tunes the model. "The bare minimum we recommend is 30 minutes of audio, but for the optimal result ... closer to 2-3 hours"; the in-app guidance says "at least an hour ... ideally as close to three hours".
- Recording spec: "between -23dB and -18dB RMS with a true peak of -3dB", single speaker, a treated room, a pop filter, about "two fists away from the mic", an XLR mic and an interface (e.g. AT2020). **"The speaking style in the samples you provide will be replicated in the output"**, so record in the exact ad delivery you want.
- **Consent and verification:** "You can only create a Professional Voice Clone of your own voice. Even with their consent, you cannot clone someone else's voice." A voice-captcha verification follows. A team member must create and verify the PVC **on their own account** and then share it privately with the studio account.
- Plan: **Creator or above** (1 PVC slot on Creator/Pro, 3 on Scale). Training takes "usually 3-6 hours" (help center), "6-24 hours" per model in another passage. A clone "cannot be exported", so keep the raw training audio.
- Languages: "Professional Voice Cloning supports all languages available in the Eleven v4 model family". PVCs auto-train on Flash v2.5 / Turbo v2.5 / Multilingual v2. **v4 training is a manual click** (the "plus" button in My Voices).
- v4 + PVC adds `clone_strength` (start at 0). "PVCs are not fully optimized for Eleven v3".

**How a cloned voice behaves across languages**
- Older models: "The language is determined by the text, the accent and pronunciation is determined by the voice itself." A clone made in English speaks German with an English accent ("might drift in and out of similar languages").
- **v4: cross-language output is native-sounding by design** ("if you clone a voice from a Korean speaker and generate English, Eleven v4 will produce natural, fluent English rather than English spoken with a Korean accent"). In principle that makes **one brand voice (e.g. a team member's PVC) usable in all 14 locales**. Which accent the model picks for pt and es is the open question in Q1. v4 is also "still being fine-tuned".

**Human VO + Voice Changer (speech-to-speech)** (https://elevenlabs.io/docs/overview/capabilities/voice-changer ; https://elevenlabs.io/docs/eleven-creative/playground/voice-changer)
- Converts a performance into a target voice, "without losing the performance nuances ... whispers, laughs, cries, accents". Max 5 min / 50 MB per file. Billed at 1,000 credits per minute. `remove_background_noise=true` available.
- **It keeps the input's language and accent:** "if you upload an audio sample with a Portuguese accent, the output will retain that language and accent." **It does not translate.** Each locale still needs a native performer. What it buys is *one consistent timbre* across those performers.
- Officially supports the 29 Multilingual v2 languages, so **not lt, hu, sl**.

**Human VO + Dubbing** (https://elevenlabs.io/docs/overview/capabilities/dubbing ; https://elevenlabs.io/docs/eleven-api/guides/how-to/dubbing/bring-your-own-transcript)
- Dubbing v2 is **"currently in alpha"**. 90+ languages. It is **the only ElevenLabs path with explicit dialect targets: `pt-PT`, `pt-BR`, `es-ES`, `es-MX`, `es-AR`, `es-CL`** (plus en-GB/US, fr-FR/CA).
- By default it **machine-translates**. "Providing your own transcript and translations is **only available to enterprise workspaces**." API editing and regeneration are also Enterprise-only.
- "Dubbed video is a high-quality preview, not a production master." Priced at about $2.20/min for v2 (API pricing page, fetched 2026-10-26).
- **Verdict:** a poor fit for Skanyx. Every translation must pass claim-safety and native review, and that is not possible below Enterprise.

### What professional users report about naturalness
- **Independent evidence is thin.** I searched 2026-10-26 for practitioner reports on v4, on speech-to-speech vs TTS and on audience perception of AI VO in ads, and found mostly vendor and affiliate content and no blind listening study.
- Artificial Analysis "Provider Voice Arena" puts Eleven v4 at #1 (Elo about 1319-1321, Sept 2026), per TechTimes (2026-09-30, https://www.techtimes.com/articles/328298/20260930/elevenlabs-eleven-v4-shifts-voice-ai-reading-acting-turbo-hits-sub-150ms-latency.htm) and eesel (https://www.eesel.ai/blog/eleven-v4). Arena Elo measures preference for short generic prompts, not ad delivery. ElevenLabs' own launch post claims a "~75%" blind preference over competitors (https://elevenlabs.io/blog/eleven-v4, 2026-09-28, vendor-run).
- GlobalGPT's hands-on v4 vs v3 test (2026-10-13, https://www.glbgpt.com/hub/eleven-v4-vs-v3): "Identical scripts produced different audio durations, so timing needs checking before editing". A more accurate clone "can also preserve unwanted noise, plosives or volume variation."
- A 2026 review stresses that brand material still needs "scripts, pronunciation checks, licensing discipline, and someone with taste listening before content goes live" (https://medium.com/@trelvek/elevenlabs-review-2026-when-it-beats-the-other-ai-voice-tools-7ff02cd5962c; quoted from a search-result summary, the page itself was not opened).
- **Synthesis (my judgement, not a sourced claim):** what makes TTS read as AI in a 30 s ad is mostly (1) a voice listeners recognise, (2) written rather than spoken copy, with even sentence lengths and no contractions, (3) uniform prosody across every line, (4) the over-bright, close, dry sound with harsh "s" that v4 copies from its source, and (5) gaps that are too regular. Routes that start from a **real human performance** (a Library PVC of a real actor, the team's own PVC, or a native human read) avoid (1) and (3) best. Mixing (Q7) addresses (4) and (5).

### Platform AI-labelling (affects the "human vs synthetic" choice)
- Secondary sources (not verified against the platforms' own pages) say that since a 2026-07-21 policy update **TikTok requires its AI-generated label on ads containing realistic AI content**, and that **synthetic voiceovers in branded content trigger the label** (CineRads, 2026-07-21, https://www.cinerads.com/blog/ai-ad-disclosure-requirements, citing https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content ; also https://www.cinerads.com/blog/tiktok-ai-content-policy). Meta's AI-info label targets significantly modified images and video; audio is named only for political and social-issue ads. YouTube requires disclosure of realistic synthetic content "a viewer could mistake for real" (https://support.google.com/youtube/answer/14328491). The EU AI Act Art. 50 requires machine-readable marking by providers and labelling of deepfakes (https://artificialintelligenceact.eu/transparency-rules-article-50/).
- **Consequence:** even a perfect TTS voice may have to carry an "AI-generated" label on TikTok. A human-voiced spot would not. Weigh this in the route choice. Verify on TikTok's own policy page before launch.

---

## Q5. Music and SFX

### Eleven Music (API)
Sources: https://elevenlabs.io/docs/overview/capabilities/music ; https://elevenlabs.io/docs/api-reference/music/compose ; https://elevenlabs.io/docs/overview/models (all fetched 2026-10-26)
- Models: `music_v2_5` ("our most advanced"), `music_v2`, `music_v1`. **The API default is `music_v1`, so always pass `model_id: "music_v2_5"`.**
- `POST /v1/music`: `prompt` OR `composition_plan` (sections with enforced durations on v2/v2.5), `music_length_ms` **3,000-600,000 ms**, `force_instrumental: true` (guarantees no vocals), `seed` (works with composition plans only; "exact reproducibility is not guaranteed and outputs may change across system updates"), `finetune_id`, `store_for_inpainting`, `sign_with_c2pa` (mp3 only).
- Output: the default `auto` gives `mp3_48000_192` on v2 models. Options include **`mp3_48000_320`** and `pcm_48000`. **Unverified:** whether PCM music is stereo; TTS PCM is mono (Q6). Request a test file and check the channel count with ffprobe before standardising on it.
- Other features: "Audio Reference" (about 30 s style reference, copyright-screened, all paid plans); "Music Finetunes" (train on tracks you own; a possible future "Skanyx sonic identity"); inpainting to edit sections; video-to-music and stem-separation endpoints exist.
- Concurrency: 2 jobs on Starter/Creator/Pro, 5 on Scale/Business (models page).
- Quality claim: "Created in collaboration with labels, publishers, and artists, Eleven Music is cleared for nearly all commercial uses, from film and television to podcasts and social media videos, and from advertisements to gaming." (capability page). That is a vendor claim. I found no independent quality evaluation of v2.5.

**Eleven Music licensing (Music Terms, "Last updated: 09 October 2026", https://elevenlabs.io/music-terms):**
- Media Rights, every plan below Enterprise Music: "**All online and offline commercial use permitted, except film, TV, radio, and Studio Games.**" Paid social ads are online commercial use, so they are allowed. The terms never name ads explicitly; the capability page names "advertisements".
- **Eligibility row (critical):** Free / Starter / Creator / **Pro**: "**For Individual Use Only**". **Scale**: "Individuals, or entities or organizations with fewer than 10 employees". **Business**: "... fewer than 50 employees". Enterprise: none. "Individual use" is not defined.
  - **So a company (MB "Skanyx") using Eleven Music arguably needs at least the Scale plan**, even though the API pricing page says "Commercial use requires Starter or higher". **Confirm with ElevenLabs before relying on Eleven Music on a Creator or Pro plan** (Uncertain / verify).
- Attribution: required on Free only ("Created in collaboration with ElevenLabs"). Streaming distribution: prohibited on Free/Starter, permitted from Creator.
- §4.4: you must follow each platform's AI-content disclosure and labelling policies.

### ElevenLabs Sound Effects (API)
Sources: https://elevenlabs.io/docs/overview/capabilities/sound-effects ; https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert (fetched 2026-10-26)
- `POST /v1/sound-generation`, model `eleven_text_to_sound_v2`. `duration_seconds` **0.5-30** (the overview page says 0.1-30), `loop: true` gives seamless loops, `prompt_influence` 0-1 (default 0.3; higher means more literal and less variable).
- Output: "MP3 for all effects; **WAV at 48 kHz for non-looping effects**." The format enum includes `wav_48000`. Cost on the website: 40 credits per second when the duration is set.
- Prompting: use plain event descriptions plus audio terms ("Impact", "Whoosh", "Ambience", "One-shot", "Braam", "Glitch", "Drone"). For multi-part events, describe them in sequence.
- Licensing: SFX are ordinary Output under the Terms of Use (last updated 2026-10-09, https://elevenlabs.io/terms-of-use): paid users "may use the Services for commercial purposes"; "as between you and ElevenLabs, you retain all rights in and to your Output". The Terms have **no** "individual use only" clause (that appears only in the Music Terms).
- Fit for Skanyx: an ignition click, a dashboard warning chime, the engine turning over, the OBD plug "clack", UI taps, whooshes. Short one-shots are where generative SFX are strongest. Keep a curated, reviewed **SFX bank** in the repo rather than generating per video, for consistency and cost.

### Stock libraries (for comparison)
- **Epidemic Sound** (https://www.epidemicsound.com/how-it-works/which-plan-is-right-for-you/ , fetched 2026-10-26, page undated):
  - Creator: individuals, **no digital ads**.
  - Pro: "professionals and freelancers ... for themselves or for clients", digital ads ✓, 3 channels per platform.
  - **Business: "for brands with a yearly revenue of less than $10 million", digital ads ✓, "Safelisting for three channels per platform"**.
  - Enterprise: above $25M revenue.
  - "Any content published during a free trial or active subscription remains cleared forever, even if you cancel", provided the channels are safelisted.
  - The pricing FAQ says ads are allowed on "a Pro or Enterprise plan" (https://www.epidemicsound.com/pricing/). This **conflicts** with the plan page's Business ✓. Business is the obvious fit for a brand. Prices did not render on the official page; third-party listings put Pro at about $16.99/mo yearly and Business at about $29.99/mo yearly (unverified). Music and SFX share one catalogue.
- **Artlist** (the official pricing page returned 403; secondary sources via search 2026-10-26, https://www.cchound.com/artlist/artlist-subscription-plans-and-pricing/ , https://wyzowl.com/artlist-review/): the Social plan is personal and excludes paid ads and client work; **Pro adds "client work, paid ads, websites, podcasts, broadcast and TV"**, up to 3 channels per platform; SFX need the "Music & SFX" variant. Projects published while subscribed stay licensed forever. Plan names and prices changed in 2026 ("Artlist Max"), so verify on artlist.io.
- **TikTok Commercial Music Library:** pre-cleared for business accounts, but **only inside TikTok**. Any other use (Instagram, YouTube, ads elsewhere) needs separate licensing. Businesses that upload their own music go through TikTok's "Music Usage Confirmation" (secondary sources: https://usethirdchair.com/blog/tiktok-commercial-music-library-what-it-covers-and-what-it-doesn-t ; https://www.foximusic.com/blog/commercial-music-licensing-tiktok-guide/ , fetched 2026-10-26; TikTok's own CML terms were not reached).
- **Meta Sound Collection:** Meta's help page says the content "can be used for commercial purposes like ads", reached from the Reels/Stories audio picker. Vendors read it as limited to Meta products (https://help.instagram.com/ipad-app/402084904469945 ; https://musicbusinessworldwide.com/meta-offers-royalty-free-music-library-to-instagram-reels-advertisers , via search 2026-10-26).
- **Implication for an automated Remotion pipeline:** in-app platform libraries cannot be baked into one master file that is ducked under the VO and exported to four platforms. They are only an option for TikTok- or Meta-only spots that are finished in the app. The studio needs **one cross-platform licence**: Epidemic Business, Artlist Pro, or Eleven Music on an eligible plan.

---

## Q6. Plans, rights, limits, output formats

### Commercial rights
- Terms of Use (last updated 2026-10-09, https://elevenlabs.io/terms-of-use): Free users "may only use the Services for non-commercial purposes"; paid users "may use the Services for commercial purposes" (Prohibited Use Policy still applies); "as between you and ElevenLabs, you retain all rights in and to your Output." No "individual only" restriction for speech or SFX.
- TTS FAQ: "commercial usage rights are only available with paid plans ... you may use generated audio for commercial purposes ... if you own the IP rights to the input content." (https://elevenlabs.io/docs/overview/capabilities/text-to-speech)
- **Eleven Music is the exception: entities need Scale or above** (see Q5).

### Plan gates that matter for this studio
| Need | Minimum plan | Source |
|---|---|---|
| Commercial use of speech and SFX | Starter | ToS §1(c); billing page ("When generating content on our paid plans, you get commercial rights") |
| Library voices via API | any paid (not Free) | voice-library page |
| IVC | Starter | billing page |
| PVC | Creator (1 slot); Scale 3 slots | PVC page / concepts page |
| MP3 192 kbps | Creator | API ref `output_format`: "MP3 with 192kbps bitrate requires you to be subscribed to Creator tier or above" |
| **PCM/WAV 44.1 kHz** | **Pro** | API ref: "PCM and WAV formats with 44.1kHz sample rate requires you to be subscribed to Pro tier or above". The pricing page lists "44.1kHz PCM audio output via API" under Pro. The tier for `wav_48000` is not stated; assume Pro. |
| Eleven Music for a company | **Scale** (fewer than 10 employees) or Business (fewer than 50) | Music Terms, 2026-10-09 |
| Own translations in Dubbing | Enterprise | dubbing BYO-transcript guide |

Plan prices and credits (pricing page https://elevenlabs.io/pricing and https://elevenlabs.io/pricing/api, fetched 2026-10-26; the page's table layout made the parse partly ambiguous, so verify before buying): Starter about $6/mo, Creator about $22/mo (first month 50% off), **Pro $99/mo**, **Scale $299/mo**, Business $990/mo; annual billing gives "two months free". The API page lists TTS at **$0.08 per 1K characters for `eleven_v4`, v3 and Multilingual v2** (Flash/Turbo $0.04), SFX about $0.12/min, Music about $0.15/min, Voice Changer about $0.12/min, Dubbing v2 about $2.20/min. Website TTS: 1 credit per character for v2 and v3.
- Volume is trivial: 14 locales x a 35 s script (about 500 chars) x 5 takes is about 35k characters per ad. Plan choice is driven by **feature gates** (PCM output, PVC, Music eligibility), not credits.

### Rate limits / concurrency
- Concurrency (simultaneous requests, Multilingual v2 column): Free 2, Starter 3, Creator 5, **Pro 10**, Scale 15, Business 15. Music: 0 / 2 / 2 / 2 / 5 / 5. Above the limit, requests queue. The response headers `current-concurrent-requests` and `maximum-concurrent-requests` report it. (https://elevenlabs.io/docs/overview/models#concurrency-and-priority)
- The pricing page shows slightly different per-plan concurrency figures (e.g. Business 25 or 40); the docs table is the conservative source.
- Per-request text limits: `eleven_v4` 10,000 chars, `eleven_v3` 5,000, Multilingual v2 10,000; Text-to-Dialogue: keep it at or under 2,000 chars per request.
- **Studio rule:** render at most 4-5 requests in parallel per locale batch, retry on 429 with backoff, and keep per-line requests sequential *within* a spot so that `previous_request_ids` exist when the next line is requested.

### Output formats (choose for mixing)
- TTS enum: `mp3_44100_{32..192}`, `mp3_22050_32`, `mp3_24000_48`, `opus_48000_{32..192}`, `pcm_{8000..48000}`, `wav_{8000..48000}`, `ulaw_8000`, `alaw_8000`. PCM is **S16LE mono** (the reverb/pan effects "produce stereo audio and are rejected ... for pcm_*"). (API reference + TTS overview, fetched 2026-10-26)
- **Pick `wav_48000` on Pro**: 48 kHz matches the video audio standard (no resampling; the local Homebrew ffmpeg 8.1.1 has no `soxr`), and the WAV header makes the files self-describing. Fallback below Pro: `mp3_44100_192`, decoded and resampled to 48 kHz once.
- **The `with-timestamps` endpoint returns base64 audio in JSON.** Use the same `output_format=wav_48000` there and decode it.
- SFX: `wav_48000` (non-looping). Music: `mp3_48000_320`, or `pcm_48000` if it proves to be stereo.

---

## Q7. Mixing and mastering for social

### Loudness targets per platform
**No platform publishes an official LUFS spec for feed video.** I searched on 2026-10-26: TikTok Ads help, the Meta and YouTube help pages via search, and several engineering blogs. What exists is community measurement and practice, and the sources disagree:

| Platform | Commonly cited target | Notes and sources (fetched 2026-10-26) |
|---|---|---|
| YouTube / Shorts | about **-14 LUFS** integrated; loud uploads are turned down, quiet ones are not turned up | The best-agreed figure (e.g. https://clickyapps.com/creator/video/guides/lufs-targets-2025 ; https://videovolumebooster.com/tools/lufs-standards). One source says -13. |
| TikTok | about -14 LUFS / -1 dBTP in most guides | Disputed: one source says TikTok has no in-feed normalisation and recommends -7 to -8 LUFS for music; others say hotter masters get turned down (https://mixingandmastering.ai/blog/lufs-for-tiktok-and-reels ; https://trackgleam.com/learn/master-for-tiktok-reels-shorts ; https://www.songbrain.ai/guides/lufs-for-spotify-and-tiktok). |
| Instagram Reels | about -14 LUFS / -1 dBTP | One guide claims "No automatic loudness normalization" (unverified). |
| Facebook Reels | -14 (most) / -16 (one source) | Not corroborated. |
| Reference standards | AES TD1004 (2015): -16 to -20 LUFS, max -1 dBTP; AES TD1008: about -16 (music) / -18 (speech); EBU R128 distribution: -23 LUFS, lossy-codec ceiling -3 dBTP | Via https://docs.telosalliance.com/docs/understanding-loudness-for-streaming-audio ; https://www.production-expert.com/production-expert-1/aes-update-loudness-recommendations-for-audio-only-streaming |

- **TikTok official creative guidance** (TopView ad specs, "Last updated: October 2026", https://ads.tiktok.com/help/article/tiktok-reservation-topview?lang=en): "Audio must remain clear and be available (video must not be completely silent)." "**Do not use harsh, disruptive noises, such as ... phone rings, alarms, etc., especially within the first 3 seconds.** These sounds may shock your audience and cause a high skip rate." "Audio can't be pure verbal broadcasting." "If the audio includes a promotion, it's prohibited to repeat the same sentence more than twice in a row." **This applies directly to Skanyx:** a dashboard warning *chime* opening is natural for the scenario, but it must be soft and short, never an alarm, and there must be music or ambience under the VO, not voice alone.
- **Decision:** one master for all four platforms at **-14 LUFS integrated, true peak ≤ -1.5 dBTP, LRA ≤ 7 LU**. -14 is the one level every source treats as either correct or harmless. -1.5 dBTP leaves room for each platform's AAC re-encode (verified locally: a -14 LUFS / -4.3 dBTP WAV encoded to AAC 320k measured -14.0 LUFS / -4.4 dBTP). A narrow LRA suits phone speakers and noisy environments.

### Ducking music under voice
Two options, both deterministic:
1. **ffmpeg `sidechaincompress`** keyed from the VO bus (filter options confirmed with `ffmpeg -h filter=sidechaincompress`, ffmpeg 8.1.1: `threshold` (linear, default 0.125), `ratio` 1-20, `attack` ms (default 20), `release` ms (default 250), `knee`, `link`, `detection`, `level_sc`, `mix`). The official example is `[1:a]asplit=2[sc][mix];[0:a][sc]sidechaincompress[compr];[compr][mix]amerge` (https://ffmpeg.org/ffmpeg-filters.html#sidechaincompress, fetched 2026-10-26).
2. **Volume automation from the TTS timestamps**: music gain drops 8-12 dB with about 100 ms ramps around each VO segment (in Remotion via the per-frame `volume` of `<Audio>`, or in ffmpeg via `volume` expressions). It is fully predictable and lets the music swell exactly in the gaps. **Preferred**, because the studio already has word-level timestamps (Q3).
- Practice values (general mixing practice, not a platform rule): VO sits about 8-12 dB above the music bed while speaking; the music comes back up within 300-400 ms after a line ends; SFX hits land between lines.

### Making TTS sound less synthetic (EQ / de-ess / dynamics)
Grounding from ElevenLabs: v4 "captures ... EQ, quality, volume, and any other minor details and imperfections ... such as plosives, harsh sibilance, and volume fluctuation", and its showcase is raw ("no EQ, compression, normalization, de-essing, plosive removal") (v4 page). The source voice's flaws come through, so the VO always needs a light finishing pass. The practices below are general audio engineering; I found no TTS-specific study:
- **Never leave digital silence** between lines. Absolute-zero gaps are a strong "assembled TTS" tell. Keep the music bed or a very low room tone running continuously.
- **Vary the gaps** between lines by hand (e.g. 120-450 ms, set by meaning, not a constant).
- **High-pass** at 70-90 Hz (male) or 90-110 Hz (female); **cut 2-3 dB around 250-350 Hz** if boxy; do **not** add a presence boost by default, because TTS is usually already forward; add 1-2 dB around 3-5 kHz only if the VO gets lost under music on a phone.
- **De-ess** (`deesser=i=0.3..0.5`): the docs list `i` intensity (default 0), `m` max ducking of treble (default 0.5), `f` frequency content kept (default 0.5) (`ffmpeg -h filter=deesser`).
- **Gentle compression** (2.5-3:1, about 10 ms attack, about 120 ms release), plus **per-line level matching** before assembly so that stitched lines do not jump in level.
- Keep breaths, but turn them down; do not gate them out. Trim any breath or click left at a line's end, using the alignment end times.
- No reverb on the VO for ads, except possibly a very short, low-level room to "seat" it. ElevenLabs' own `audio_effects.environment_id` reverb makes the output stereo and is rejected for `pcm_*` formats, so do any room effect in the mix, not at generation.

### Two-pass `loudnorm` (tested 2026-10-26 on ffmpeg 8.1.1 with synthetic signals)
`loudnorm` facts (from `ffmpeg -h filter=loudnorm` and https://ffmpeg.org/ffmpeg-filters.html#loudnorm): defaults I=-24, LRA=7, TP=-2; `linear=true` applies only if measured_I/LRA/TP/thresh are all given, the target LRA is not below the source LRA, and the gain does not breach TP, "If any of these conditions aren't met, normalization mode will revert to dynamic." "In dynamic mode ... the audio stream will be upsampled to 192 kHz. Use the -ar option or aresample filter to explicitly set an output sample rate."

The full filter is in "Decisions for the studio" below. Result on the test mix: pass 1 measured -21.44 LUFS; pass 2 printed "Normalization Type: Linear" with output **-13.9 LUFS, true peak -4.3 dBTP, 48 kHz stereo**; after AAC 320k: -14.0 LUFS / -4.4 dBTP. (Synthetic pink-noise "VO" and a sine-chord "music" were used, so this proves the syntax and the arithmetic, not the sound.)

**Gotcha found while testing:** in **zsh**, `...offset=$OFF:linear=true` is read as the `:l` (lowercase) *modifier* on `$OFF` and produces `-0.23inear=true`. Always write `${OFF}` (braces) in studio shell scripts, or build the filter string in Node/Python.

---

## Decisions for the studio

### 1. Model
- **`eleven_v4` on `POST /v1/text-to-speech/{voice_id}/with-timestamps`**, with `language_code` set every time, `output_format=wav_48000`, `apply_text_normalization: "off"` (the script is pre-normalised; A/B against `auto` once), stitching via `previous_request_ids` / `next_request_ids`, and a pinned `pronunciation_dictionary_locators[].version_id`.
- It is the only top-quality model covering all 14 locales (Multilingual v2 lacks lt/hu/sl), the only one applying IPA phoneme rules outside English, and it supports PVCs fully. v3 is now "previous generation", has no stitching and is "not fully optimized" for PVCs.
- **Fallback for a locale where v4 fails the native-ear test:** `eleven_multilingual_v2` with a *native* Library voice for that locale (covers es-ES and pt-PT via voice accent; not lt/hu/sl), using `<break>`, `speed` and alias-only dictionaries. Treat the model as a per-locale setting, not a global one.
- **Archive approved WAVs.** v4 "may shift over time" and `seed` is best-effort only, so re-renders are not reproducible.

### 2. Voice route (ranked)
1. **Primary: native-language Voice Library voices that are PVCs of real voice actors, one per locale** (Studio Quality label, notice period of 1 year or more, no Live Moderation, no credit multiplier, not Brian/Liam/Adam/Jessica/Matilda/Sarah). This gives a human-sourced timbre and a **native accent per locale**, which is the safest answer to the PT-PT / ES-ES risk. Library voices also need no consent paperwork beyond the Library terms, and already generated output stays usable if the voice is withdrawn. Shortlist 2-3 voices per locale and pick by blind native-speaker listening.
2. **Brand-voice option (phase 2, if the owner wants one recognisable Skanyx voice):** a team member records 1-3 h for a **PVC** in their native language (EN or LT), in the exact ad delivery (warm, calm, conversational), at -23 to -18 dB RMS / -3 dBTP in a treated room. They create and verify it **on their own ElevenLabs account** and share it privately, then fine-tune it on v4. Test every locale on v4. Get a written, revocable consent covering ads, all 14 languages, paid media and what happens on revocation or if they leave. A voice is personal data under GDPR; a lawyer should approve the consent text (not researched here).
3. **Human read for the hero locales** (EN, DE, PL, LT, the highest-spend markets): a native person reads the script, the take goes through Scribe v2 for timestamps (not Forced Alignment, because lt/hu/sl are unsupported there), and it may be passed through Voice Changer only if one timbre across languages is wanted (only 29 languages). This is the most natural route and avoids the possible TikTok AI-label requirement.
4. **Do not use** Voice Design as the primary voice (v4: "may not be as performative"), and do not use Dubbing (own translations are Enterprise-only, the machine translation breaks claim-safety, and it is alpha).

### 3. Generation settings (starting point; tune by ear)
```json
{
  "model_id": "eleven_v4",
  "language_code": "<locale>",
  "voice_settings": { "stability": 0.45, "similarity_boost": 0.75 },
  "apply_text_normalization": "off",
  "seed": <fixed per spot+line for auditioning>,
  "previous_request_ids": ["<line N-1>", "<line N-2>", "<line N-3>"],
  "pronunciation_dictionary_locators": [
    {"pronunciation_dictionary_id": "<skanyx-brand>", "version_id": "<pinned>"},
    {"pronunciation_dictionary_id": "<skanyx-<locale>>", "version_id": "<pinned>"}
  ]
}
```
- Add `clone_strength: 0` only when the voice is a PVC fine-tuned on v4. Do not send `style` or `speed` (v4 has neither).
- Stability: lower it (0.35-0.45) for the "panic → relief" story and generate 3-5 takes per line; raise it (0.55-0.65) for the price/CTA line.
- **Script rules:** one sentence per request, written for the ear (contractions, short clauses, no lists), and at most one English delivery tag per line, e.g. `[calm, reassuring]`. No SFX tags in the voice. Use CAPS emphasis on at most one word per spot.

### 4. Pronunciation dictionaries to create
`skanyx-brand` (phoneme rules, v4) and one `skanyx-<locale>` alias dictionary per locale, max 3 locators per request. Rules are case-sensitive, and the first match wins, so list longer strings first ("OBD-II" before "OBD"). **Spoken forms must come from the repo's term banks** (`data/term-banks/{hu,nl,pt,ro,sl,tr,uk}.json` already state e.g. TR "Skanyx - read 'skaniks' ... final x is /ks/", "OBD2 - spoken 'obi di iki'", "PPI - spoken 'pe pe i'"; HU "final -x is pronounced [ksz]", "PPI ... read 'pé-pé-í'", OBD2 → "kettő"; pt.json `variant: "pt-PT"`). Native reviewers fill in en/de/es/pl/lt/fr/it.

| Grapheme (case variants) | Rule | Notes |
|---|---|---|
| `Skanyx`, `SKANYX` | phoneme IPA `ˈskanɪks` (EN may prefer `ˈskænɪks`) | **Owner must confirm the canonical pronunciation** (EN "SKAN-iks"?). The term banks agree the final x = /ks/. Alias fallback for non-v4 models: `Skaniks`. For **uk** text (Cyrillic context), test an alias `Сканікс` in the *spoken* track only: the uk term bank forbids transliteration in *visible* text, but the VO is not visible. |
| `Skanyx Pro` | covered by the above | "Pro" is read natively per locale; check fr/it. |
| `OBD2`, `OBD-II`, `OBD` | alias per locale: en "O B D two", de "O B D zwei", pl "O B D dwa", lt "O B D du", tr "obi di iki", hu "ó bé dé kettő", ... | Letters spelled out as each language says them. Native review required. |
| `ELM327` | alias per locale, digit by digit ("E L M three two seven") | Only if a script mentions it. |
| `PPI`, `DPF`, `EGR`, `ECU`, `VIN` | alias, letter by letter per locale | Only the ones scripts use. |
| `iOS`, `App Store`, `Google Play` | alias only if a test shows misreads (e.g. pl/uk) | Test first. |
| Fault codes (`P0420`...) | **not in a dictionary**: write the spoken form in the script's `spoken` track (en "P zero four two zero"; de "P null vier zwei null"; ...) | The dictionary needs exact graphemes, so codes are better handled by the script normaliser. Digit-by-digit is unambiguous in every language. |
| Prices (`€79.99`, `€14.99`, `€24.99`...) | **not in a dictionary**: spoken form in the script per locale number rules (de "neunundsiebzig Euro neunundneunzig", fr "soixante-dix-neuf euros quatre-vingt-dix-neuf", ro per its term bank) | Displayed price format follows the term banks' `numberFormat`. Current prices are canonical in the web repo (`CLAUDE.md` Stripe section); never hardcode from memory. |

### 5. Output formats
- TTS: `wav_48000` (needs the **Pro** plan for 44.1/48 kHz PCM/WAV); fallback `mp3_44100_192` (Creator).
- SFX: `wav_48000`, non-looping one-shots, kept in a reviewed SFX bank in the studio repo.
- Music: `music_v2_5`, `force_instrumental: true`, `mp3_48000_320` (or `pcm_48000` once verified stereo), composition plan with exact section lengths (e.g. 30,000 ms with an ending hit).
- Master: 48 kHz / 24-bit WAV, then AAC-LC 320 kbps 48 kHz stereo, muxed with `-c:v copy -movflags +faststart`.

### 6. Music and SFX source
- **SFX: ElevenLabs Sound Effects.** Covered by the normal paid-plan commercial terms, with no "individual only" clause. Use it for the dashboard chime (soft, never an alarm in the first 3 s, per TikTok), ignition, the OBD plug click, UI taps and whooshes.
- **Music: decide on plan cost.**
  - If the account is **Scale or above** (fewer than 10 employees), use **Eleven Music v2.5**: same vendor, exact-length composition plans, a Finetune later for a sonic identity.
  - **Below Scale, use Epidemic Sound Business** ("brands with a yearly revenue of less than $10 million", digital ads ✓, content stays cleared forever if published on safelisted channels while subscribed) or Artlist Pro (paid ads ✓). Confirm which applies after the Uncertain item on the Music Terms.
  - Platform in-app libraries (TikTok CML, Meta Sound Collection) are TikTok-only or Meta-only, so they do not suit one ducked master. Use them only for spots finished in-app.

### 7. Loudness / mix chain (exact ffmpeg; tested on ffmpeg 8.1.1, 2026-10-26)
Inputs: `0` = assembled VO track (mono, 48 kHz; lines placed at timeline positions), `1` = music (stereo 48 kHz), `2` = SFX track (stereo, already placed). If the music is ducked by timestamp automation upstream (preferred), replace the `sidechaincompress` node with a pass-through.
```bash
GRAPH="[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=mono,\
highpass=f=80,equalizer=f=300:t=q:w=1:g=-2,deesser=i=0.4:m=0.5:f=0.5:s=o,\
acompressor=threshold=-20dB:ratio=3:attack=10:release=120:makeup=2,\
pan=stereo|c0=c0|c1=c0,asplit=2[vo][key];\
[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=-8dB[mus];\
[mus][key]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=350:knee=4[duck];\
[2:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[sfx];\
[vo][duck][sfx]amix=inputs=3:duration=first:normalize=0[mix]"

# Pass 1: measure
ffmpeg -hide_banner -i vo.wav -i music.wav -i sfx.wav \
  -filter_complex "${GRAPH};[mix]loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json" -f null - 2> pass1.log
# parse input_i, input_tp, input_lra, input_thresh, target_offset from the JSON block in pass1.log

# Pass 2: apply (linear), resample back to 48 kHz, 24-bit master
ffmpeg -hide_banner -y -i vo.wav -i music.wav -i sfx.wav \
  -filter_complex "${GRAPH};[mix]loudnorm=I=-14:TP=-1.5:LRA=7:measured_I=${MI}:measured_TP=${MTP}:measured_LRA=${MLRA}:measured_thresh=${MTH}:offset=${OFF}:linear=true:print_format=summary,aresample=48000[out]" \
  -map "[out]" -c:a pcm_s24le master.wav

# Mux (video rendered by Remotion without final audio)
ffmpeg -y -i video.mp4 -i master.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart final.mp4

# Gate: re-measure the final file; fail the build unless I = -14 ±0.5 LUFS and TP <= -1.0 dBTP
ffmpeg -hide_banner -i final.mp4 -map 0:a -af ebur128=peak=true -f null - 2>&1 | tail -12
```
- Assert that pass 2 reports linear mode (`Normalization Type: Linear` in `summary`, `"normalization_type" : "linear"` in `json`). If it falls back to dynamic, the mix's LRA is above 7 or a peak blocks the gain, so fix the mix (tame the music or SFX peaks) rather than accept dynamic mode.
- Use `${VAR}` braces (the zsh `:l` modifier gotcha), or build the filter string in Node.

---

## Uncertain / verify (before the studio commits)

**Highest risk to naturalness and correctness:**
1. **PT-PT and ES-ES on v4.** v4's FAQ names "Portuguese (Brazil)" and "Spanish (LatAm)", and v4 replaces the source accent when the languages differ. Test: generate the same 3 lines with 3 native PT-PT Library voices and 3 Castilian voices on v4 **and** on Multilingual v2, and have a native Portuguese and a native Spaniard rate them blind. Decide the model per locale from the result. Note that the web repo's ES audience is about 62% LatAm (memory note `reference_es_audience_is_latam`), so a LatAm accent may be acceptable or even preferable for es. That is a marketing call; PT-PT is not negotiable (pt is PT-PT across the repo).
2. **lt, sl, hu quality on v4.** These are the least-resourced of the 14 ("Some languages are handled more fluently than others"). Have a native ear check every first spot. Forced Alignment does not support these three; use Scribe v2 timestamps instead.
3. **The `with-timestamps` endpoint with `model_id=eleven_v4`.** No doc confirms or excludes it. One test call settles it. Also check whether `alignment` reflects the original grapheme or the alias when a pronunciation-dictionary alias fires.
4. **`apply_text_normalization: "off"` vs `"auto"`** with pre-written spoken text on v4: A/B once per language family.
5. **Delivery tags in non-English scripts.** The docs show English tags only. Test `[calm, reassuring]` inside a German, Polish or Turkish line, and make sure the tag is not spoken aloud and does not pull the accent toward English.
6. **v4 drift.** ElevenLabs says the model "may shift over time". Re-test the voice shortlist monthly; the studio keeps approved WAVs as masters.

**Licensing and plan:**
7. **Eleven Music "For Individual Use Only" on Free/Starter/Creator/Pro** (Music Terms, 2026-10-09). Does a company account on Pro breach it? Ask ElevenLabs support or sales in writing. The API pricing page's "Commercial use requires Starter or higher" seems to conflict with it.
8. **Exact plan prices and the tier for `wav_48000`.** The pricing pages parsed ambiguously (e.g. Starter/Creator first-month promos, Business concurrency 15 vs 25 vs 40). The API reference names Pro for 44.1 kHz PCM/WAV but is silent on 48 kHz.
9. **Whether `pcm_48000` music output is stereo.** TTS PCM is mono (inferred). Check one music file with ffprobe.
10. **Epidemic Sound: is Business or Pro the right tier for a brand running paid ads?** The pricing FAQ says "Pro or Enterprise", the plan page says Business includes digital ads. Artlist's current plan names and prices (official page 403'd) also need checking.
11. **Platform AI labels.** TikTok reportedly requires the AI-generated label on ads with synthetic voiceover (secondary sources dated 2026-07/08). Confirm on TikTok's Business Help Center and in Ads Manager, and decide whether the label is acceptable on every TikTok spot. If not, that argues for human VO on TikTok. Also check Meta, YouTube and EU AI Act Art. 50 implications with counsel; this research did not cover them in depth.
12. **Team-member voice clone consent** under GDPR and employment law (revocability, scope, what happens on departure). Not researched; needs legal advice before a PVC route.

**Facts taken from secondary sources only:** the Artificial Analysis arena rank for v4 (via TechTimes and eesel), per-platform LUFS figures (blogs, no official specs exist), TikTok CML and Meta Sound Collection scope (vendor blogs plus one Meta help snippet), Epidemic prices and Artlist terms.

**Not covered here (other research files):** Remotion's own audio rendering and volume automation API (01-remotion), caption styling, and the script-writing voice for the ear.
