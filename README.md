# skanyx-studio

Short-form vertical videos for Skanyx: Remotion + ElevenLabs + real app recordings + real B-roll. Agents start at `CLAUDE.md`; humans start here.

## Setup (once)

```
nvm use                      # Node 26
npm ci
cp .env.example .env         # fill ELEVENLABS_API_KEY (studio-scoped key), MEDIA_ROOT (the SSD)
npm run media:setup          # creates $MEDIA_ROOT/{raw,mezz,vo,sfx,music,renders,qa}, links public/media
npm run check                # lint + typecheck + tests
npm run dev                  # Remotion Studio; open Calibration > SafeZoneCalibration
```

Then, once:
1. `npm run voice:dictionaries`, paste the two ids into `.env`.
2. `npm run voice:listen-set -- search`, pick 3-5 candidates, `render` them, listen blind, write the pick into `docs/voice-guide.md` and `ELEVENLABS_VOICE_ID`.
3. Download the Apple bezel and store badges (`public/devices/README.md`, `public/badges/README.md`).
4. `npm run render -- SafeZoneCalibration`, upload privately to all four platforms, screenshot on two phones, correct `src/lib/safe-zones.ts` and set `calibrated = true`.

## Making a video

See the pipeline block in `CLAUDE.md`. Each video is a folder under `projects/` copied from `projects/_TEMPLATE/`, and every gate is a script: `voice:tts`, `media:normalise`, `render`, `audio:mix`, `qa`. The owner approves the brief and the final; a named person signs the claims.

## Where things are

| | |
|---|---|
| Rules | `docs/style-guide.md`, `docs/checklist.md`, `docs/disclosure.md` |
| Voice, filming | `docs/voice-guide.md`, `docs/shooting-guide.md` |
| Research | `docs/research/` |
| Media | `$MEDIA_ROOT` (SSD), indexed in `manifests/media.jsonl` |
| Facts | the web repo (`$WEB_REPO`), read through `npm run facts` |
