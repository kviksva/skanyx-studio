# Shooting guide: B-roll on the team's own cars

For the BMW E60 535d and E61 535. Research and sources: `docs/research/05-capture-footage.md` section 5 (camera settings, light, moiré, gear) and the "Decisions" block. Everything here is for footage that passes through `npm run media:normalise -- --kind broll`.

## Camera (iPhone)

| Setting | Value |
|---|---|
| App | Blackmagic Camera (free). The stock Camera app hides shutter and ISO. |
| Resolution, orientation | 4K **vertical** (2160x3840), 9:16 guide on. Horizontal only for shots also wanted on the website. |
| Codec | iPhone 15 Pro or newer: ProRes 422 HQ, **Apple Log** (HEVC 10-bit Log if storage is short). Older: H.265 SDR Rec.709. |
| HDR | **Off** (Settings > Camera > Record Video > HDR Video). HDR clips next to SDR screen recordings come out washed or clipped. |
| Frame rate | **30** (the composition's rate). 60 for hand detail to conform as 50% slow motion. Never 24 or 25 unless the whole project moves to 25. |
| Shutter | 1/60 (180 degrees). **1/50** under mains light (Lithuania is 50 Hz) or if the cluster bands. 1/120 at 60 fps. |
| ND | Variable ND to hold the shutter in daylight; without it the phone goes to 1/1000+ and motion looks staccato. |
| ISO | Locked, at most 400 by day, 800 at night, main 1x lens only in the dark. |
| White balance | Locked Kelvin: 5600 K day, 4000-4500 K night (amber lights stay amber). |
| Focus, exposure | Manual focus with peaking; zebras or false colour so the warning light never clips to white. |
| Stabilisation | Off or lowest on the gimbal; standard handheld; never the most-cropped mode up close. |
| Monitoring | Built-in Apple Log to Rec.709 LUT for preview only, never baked. |
| Audio | Always record: the adapter click, ignition, door, chime are the signature. |

Storage: ProRes 422 HQ 4K30 is about 6-7 GB a minute. Shoot short deliberate takes, offload to the SSD after each location.

## Light inside a car

- **Blue hour** (the half hour after sunset) for dash and interior: the sky fills the cabin, the cluster glows, nothing goes black and noisy.
- Practicals do the work: cluster, phone screen on hands, door courtesy light. One small bi-colour LED at 5-10%, warm, hidden in the footwell or bounced off the headliner, never aimed at glass.
- Reflections: dark clothing, cabin lights off unless motivated, black cloth over the dash when filming through the windshield, CPL for through-glass daylight, angle the filmed phone away from the LED.
- Instrument-lighting dimmer at maximum (PWM at full duty), then test 1/50, 1/60, 1/100 and watch for rolling bands on the cluster and on the filmed phone's OLED.

## Filming a phone screen

- Filmed phone at fixed high brightness, auto-brightness off. Slight angle, a little distance, or a hair of defocus against moiré.
- Hero shots: film the real app (or a dark screen), track the four corners (DaVinci Resolve Fusion Planar Tracker, free) and corner-pin the clean recording; a locked-off shot can be corner-pinned in Remotion with `matrix3d`.
- The demo vehicle on the filmed screen must be the filmed car (see `docs/disclosure.md`).

## Shot list (13 reusable shots)

| # | Shot | Framing | Move | fps | Sound |
|---|---|---|---|---|---|
| 1 | Car parked at blue hour, wide | 9:16, 1x, low | slow gimbal push-in 3-4 s | 30 | ambience |
| 2 | Start button or key turn, close | 1x close | static | 60 | click + chime |
| 3 | Cluster bulb-check sweep, the amber engine light stays | over the wheel | rack focus rim to cluster | 30 | engine idle |
| 4 | Hands tighten on the wheel, glance down (no face) | over the shoulder | static | 30 | - |
| 5 | Phone lights the footwell; hand lowers the adapter | sill or passenger footwell, low | slow tilt down | 60 | rustle |
| 6 | Adapter seats in the port; its LED blinks | 2x close | locked | 60 | **the click** |
| 7 | Phone in hand, thumb taps (screen replaced in post) | over the shoulder, phone in lower third | static or gimbal | 30 | tap |
| 8 | Phone and cluster in one frame | 1x | rack focus phone to light | 30 | - |
| 9 | Driving POV through the windshield | suction mount, 1x | car motion | 30 | road |
| 10 | Exterior pass-by | roadside tripod | pan | 30 | pass-by |
| 11 | Bonnet open, M57 cover, hand points | 1x | slow push | 30 | latch |
| 12 | Resolution: cluster clear, phone in the cup holder showing the result | 1x | static | 30 | calm |
| 13 | Used-car buyer variant: keys handed over, adapter into someone else's car | 1x | handheld on gimbal | 30 | no dialogue |

Minimum per story: 1, 3, 5, 6, 7, 12. Three takes of each, 6-10 s, 2 s handles. The OBD port on the E60/E61 is under the driver-side dash behind a flip-down cover (verify on both cars; shoot from the sill, low, 60 fps, hold 2 s before and after, record the click).

## What makes it look premium (and what gives it away)

Control the light; give every frame a foreground edge (wheel rim, door frame, bolster); move slowly and on purpose; 180-degree motion blur; locked exposure and WB; one consistent grade; real textures and real sound; fewer, longer, better takes. The tells of amateur: exposure pumping, WB shifts, digital zoom, ultra-wide distortion up close, shaky handheld. The tells of AI: things that never happened. Every B-roll moment is a real event on the team's own cars.

## Grade

DaVinci Resolve 21 (free): Colour Space Transform Apple Log to DaVinci Wide Gamut, grade, CST to Rec.709 Gamma 2.4; one show PowerGrade on every B-roll shot. **Never grade the app recordings.** Export one test clip through Remotion next to a screen recording and lock the export tag (Rec.709 vs Rec.709-A) once. Batch dailies without Resolve: `ffmpeg -vf lut3d=...` then the normaliser.

## Naming

`media/raw/broll/<date>_<car>_<shot#>_<take>.mov` (e.g. `2026-11-02_e60_06_t2.mov`). The normaliser keeps the stem. Log source, date and licence (own footage: "team, all rights") in `manifests/media.jsonl` via the script.

## Gear (about USD 450-650, verify prices)

Variable ND for the iPhone, a small RGBWW LED (Aputure MC Pro class), a phone gimbal (DJI Osmo Mobile 8), suction mount + magic arm + clamp, mini tripod, black cloth and gaffer tape, an external SSD only for 4K60 ProRes. Software: Blackmagic Camera, DaVinci Resolve 21, ffmpeg, all free.
