# 05 - Capture footage: Simulator screen recordings + iPhone B-roll

Researched 2026-10-26. Status: COMPLETE (all six questions, decisions, verify list).
Host this was researched against (read-only checks): Apple M4 Pro, macOS 27.0.1 (26A434), Xcode 27.1 (27A9275), Flutter 3.47.1 (framework 2026-08-19), ffmpeg at /opt/homebrew/bin/ffmpeg.
Existing harness read for context: `car_health_ai/scripts/store_captures.sh` (boots "iPhone 16 Pro Max", pins status bar 9:41, runs `flutter drive` in DEBUG with `--dart-define=SKANYX_STORE_CAPTURE=true`), `integration_test/store_captures_test.dart` (`IntegrationTestWidgetsFlutterBinding`, screens pushed on the root navigator, `_settle()` pumps 100 ms steps because `pumpAndSettle` times out on looping shimmers/charts), `test_driver/integration_test.dart` (`integrationDriver(onScreenshot:)`).

## 1. iOS Simulator recording quality

### 1.1 What this machine actually has (checked read-only, 2026-10-26)
- **Xcode 27 replaced Simulator.app with Device Hub.** `/Applications/Xcode.app/Contents/Applications/` holds `DeviceHub.app` and no `Simulator.app`; Spotlight finds no `com.apple.iphonesimulator` bundle. Apple's doc now says "Use Device Hub to capture screenshots and record videos" (https://developer.apple.com/documentation/xcode/capturing-screenshots-and-videos-from-devices, (c) 2026, Xcode 27). Michael Tsai's roundup (2026-06-25, https://mjtsai.com/blog/2026/06/25/xcode-27s-device-hub/) quotes Collin Allen: Device Hub "takes the place of the Simulator app", and Matt Gallagher: the rename "broke existing tools that expect the old Simulator". Device Hub also lacks the old Debug menu (slow animations, memory warning) per Léo Natan in the same roundup.
  - **Consequence for the existing harness:** `store_captures.sh` line `open -a Simulator --args -CurrentDeviceUDID "$UDID"` runs under `set -euo pipefail`; on this Xcode it very likely fails and aborts the script (VERIFY; not run, per brief). `simctl` itself is unchanged and is all a headless recorder needs; no window has to be open for `recordVideo` (VERIFY).
  - `defaults write com.apple.iphonesimulator ShowSingleTouches 1` was a Simulator.app preference; with Device Hub it is moot (see 1.4).
- `xcrun simctl help io` on Xcode 27.1 (27A9275), verbatim essentials:
  - `recordVideo [--codec=<codec>] [--display=<display>] [--mask=<policy>] [--force] <file or url>` "Records the display to a QuickTime movie".
  - `--codec` "h264" or "hevc". **Default is "hevc".**
  - `--mask` for non-rectangular displays: `ignored` (unmasked framebuffer), `alpha` ("Not supported, but retained for compatibility; the mask is rendered black"), `black`. So a recording can never carry transparent corners; record `--mask=ignored` (full rectangle) and do any rounded-corner / device-frame treatment in Remotion.
  - `--display` picks a screen (ID, name, "primary", UUID, or "internal"/"external"); `simctl io <dev> enumerate` lists them. Only relevant if we ever record an external display.
  - `--force` overwrites an existing file.
  - "simctl writes 'Recording started' to stderr once the first video frame has been processed. Look for this if you want to wait for the recording to start." Stop with SIGINT; "simctl exits once the in-flight frames are processed and the video file is finalized" (so the script must `wait` on the PID before touching the file).
  - New in this Xcode: `screenConfig ... geometry <w>x<h>[@scale]` and `power on|off` (not needed).
  - There is **no bitrate, quality or fps flag**.
- `xcrun simctl help status_bar` (Xcode 27.1): `override` accepts `--time` (ISO date also sets the date), `--dataNetwork hide|wifi|3g|4g|lte|lte-a|lte+|5g|5g+|5g-uwb|5g-uc`, `--wifiMode`, `--wifiBars 0-3`, `--cellularMode notSupported|searching|failed|active`, `--cellularBars 0-4`, `--operatorName ''`, `--batteryState charging|charged|discharging`, `--batteryLevel 0-100`; plus `list` and `clear`. The harness already pins 9:41 / 100% / 4 bars / 3 wifi bars.
- `xcrun simctl help ui`: `appearance light|dark`, `increase_contrast`, `content_size` - useful to pin the look per shot so takes match.

### 1.2 Frame rate and fidelity of `simctl recordVideo`
- Output is **variable frame rate**: a frame is written when the screen changes. The best current measurement is in Evan Bacon's serve-sim PR #178 (merged 2026-10-23, https://github.com/EvanBacon/serve-sim/pull/178), recording the same flow simultaneously with `simctl io recordVideo --codec=h264` and his IOSurface recorder at 1206x2622 (native res of a 6.3" Pro):
  - simctl: avg 40.6 fps, r_frame_rate 600 (a timebase artefact, i.e. VFR), 486 frames, 39 PTS gaps > 25 ms, longest stall during motion 233 ms, 3.38 Mb/s, SSIM vs PNG 0.99960.
  - serve-sim: 60 CFR, 661 frames, **489 distinct frames vs simctl's 478**, longest stall 183 ms, 4.57 Mb/s, SSIM 0.99963.
  - Reading: simctl drops very few frames compared with a dedicated recorder (478 vs 489 distinct); the big stalls exist in both, so they come from the simulated app not rendering, not from the recorder. The 60 CFR of the new tool is mostly duplicate frames, which ffmpeg's `fps=60` also produces. **On the Simulator, smoothness is limited by the app (debug mode, see 2.2), not by the recorder.**
  - Bitrate is low (~3.4 Mb/s at 1206x2622, h264). Flat UI compresses well (SSIM 0.9996), but a 2x Remotion zoom on a gradient or small text will show it. HEVC (the default) should hold more detail per bit than h264 (VERIFY with ffprobe + a zoomed crop on this machine).
- Antoine van der Lee (RocketSim author) wrote that RocketSim used to rely on "the Simulator's standard recording, which outputs at most 30 FPS" (referenced in https://www.avanderlee.com/xcode/rocketsim-15-voiceover-navigator-pro-simulator-recordings/, 2026-04-07, and the 2024-02-04 post https://www.avanderlee.com/workflow/capture-ios-simulator-video-app-preview/ which says Simulator recordings have "inconsistent frame rates"). That 30 fps figure is about the GUI Record button / older Xcode, and conflicts with the 40.6 fps *average* measured above on simctl; treat the true ceiling as unknown until measured (VERIFY: per-frame PTS deltas during a continuous animation, see "Uncertain / verify").
- Simulated displays and refresh: no source confirms a simulated iPhone runs at 120 Hz; an old Apple forum thread saw a ProMotion iPad simulator report 60 (https://developer.apple.com/forums/thread/79085, undated/old). Plan for 60 Hz content.
- Resolution: simctl records the device framebuffer, i.e. native pixels (the harness's iPhone 16 Pro Max = 1320x2868 per its own header comment). VERIFY with ffprobe.

### 1.3 Alternatives
| Route | What you get | Verdict |
|---|---|---|
| `simctl io recordVideo` (Xcode 27.1) | Native-res framebuffer, VFR, HEVC/H.264, status-bar override, fully scriptable, no window needed | **Primary.** Normalise to CFR afterwards. |
| serve-sim native recorder (PR #178, 2026-10-23) | IOSurface capture, AVAssetWriter/VideoToolbox, 60 CFR (up to `--fps 120`), H.264/HEVC | Promising but 3 days old; no Xcode version stated. Re-evaluate in a month; not needed since ffmpeg does the CFR step. |
| RocketSim (Mac App Store; docs "Last updated Oct 9, 2026", https://www.rocketsim.app/docs/features/capturing/recordings) | MP4/GIF, touch indicators (from Mac pointer), bezels incl. iPhone 18 Pro, 120 fps framebuffer recording (Pro tier, per App Store listing), App-Preview mode; RocketSim 16 records physical devices too | GUI tool. Its touch dots come from mouse clicks, so they will **not** show `flutter drive` taps. Useful for ad-hoc manual takes, not for the scripted pipeline. |
| Device Hub Record button (Xcode 27) | Saves "Screen Recording <device> <timestamp>" to Desktop; no documented codec/fps/touch options | Manual only; no CLI. |
| ScreenCaptureKit / OBS capture of the Device Hub window | Captures the *window* at Mac display scale, plus window chrome | Worse than framebuffer capture; skip. |
| Physical iPhone over USB in QuickTime (File > New Movie Recording > iPhone as camera) | Real device GPU, can run the app in **profile** mode | Resolution/fps not documented by Apple; older guides say QuickTime exports 720p/1080p (https://labnol.org/software/quicktime-ios-screen-recorder/8375, old). Status bar cannot be overridden on hardware. Keep as the hero-shot fallback if simulator jank is visible (see 2.2). VERIFY resolution and fps. |
| Device Hub remote screen of a physical device (iOS 27 only, per Steve Troughton-Smith in the mjtsai roundup) | Unknown whether Record works for physical devices (Apple's doc only says "Record videos on simulated devices") | VERIFY. |

### 1.4 Showing touches
- Simulator touch indicators never reached `simctl` recordings: "these indicators don't show up in the screen recording" (Maestro, 2025-08-29, https://maestro.dev/blog/showing-tap-indicators-on-ios-recordings); their workaround injects a ShowTime dylib that draws dots from **UIKit** touches.
- That workaround cannot help us: `flutter drive` taps are synthetic `PointerEvent`s dispatched inside the Flutter framework (`WidgetTester.tap` -> `TestGesture` -> binding), so no UIKit touch ever exists for ShowTime, RocketSim or the Simulator to see.
- **Worse, the integration-test binding draws its own debug crosshairs on every test tap.** Flutter 3.47.1 `flutter_test/lib/src/binding.dart` (local SDK, framework 2026-08-19): `LiveTestWidgetsFlutterBinding.initInstances()` registers `RenderView.debugAddPaintCallback(_handleRenderViewPaint)`, which paints a coloured circle-plus-cross (radius = 5% of the shortest side, hue varies per pointer id) at each down pointer whose `pointerEventSource` is `TestBindingEventSource.test`, fading over 2 frames after pointer-up. `IntegrationTestWidgetsFlutterBinding extends LiveTestWidgetsFlutterBinding` and does not disable it. The paint callback runs only in debug mode (`RenderView.paint` wraps it in `assert`), and the Simulator only runs debug (2.2). So **a raw simctl recording of today's harness would show rainbow crosshairs on every tap.**
  - Fix (from the same file): dispatch taps with `binding.handlePointerEventForSource(event, source: TestBindingEventSource.device)` after setting `binding.shouldPropagateDevicePointerEvents = true`; that branch calls `super.handlePointerEvent(event)` directly and records no crosshair. A small `humanTap()` helper builds `PointerDownEvent`/`PointerUpEvent` at the widget centre (logical coordinates) with a human hold time. VERIFY that hit-testing is identical (device-source events are documented as "global" coordinates; on a single full-screen view global == local).
- **Decision: draw touches in Remotion from the timeline JSON** (a soft ring at the tap point, ~180-250 ms press, scale-down on press, fade on release). Fully controllable, brand-coloured, consistent across locales and platforms, and it never bakes into the footage.

## 2. Flutter-side determinism for video

### 2.1 Build mode: the Simulator is debug-only
- Flutter docs, Build modes (page updated 2026-05-05, reflects Flutter 3.47, https://docs.flutter.dev/testing/build-modes): "Application performance can be janky in debug mode. Measure performance in profile mode on an actual device." / "Profile mode is disabled on the emulator and simulator, because their behavior is not representative of real performance." / "The emulator and simulator execute _only_ in debug mode."
- Confirmed in the local SDK (Flutter 3.47.1): `flutter_tools/lib/src/ios/simulators.dart:396` `bool supportsRuntimeMode(BuildMode buildMode) => buildMode == BuildMode.debug;`. So **`flutter drive --profile` cannot target a Simulator.**
- Profile mode works on a **physical** device: Flutter cookbook "Profile performance" (updated 2026-09-29, https://docs.flutter.dev/cookbook/testing/integration/profiling): `flutter drive --driver=test_driver/perf_driver.dart --target=integration_test/scrolling_test.dart --profile`, and "Run the command with `--no-dds` when running on a mobile device or emulator."
- **Best alternative on the Simulator** (what we actually do):
  1. **Warm-up pass, then the recorded pass.** Run each flow once unrecorded in the same app session (JIT-compiles the hot paths, decodes images, loads fonts, builds Impeller pipelines), reset state, then arm the recorder. Most debug-mode stutter is first-time work.
  2. `precacheImage` every image the shot shows before arming; keep the Mac on power with nothing heavy running.
  3. **Measure every take** and auto-retake: register `SchedulerBinding.instance.addTimingsCallback` (documented in the local SDK `scheduler/binding.dart`; ~0.01% CPU overhead) during the take and count frames whose `totalSpan` > 16.7 ms inside the recorded window; on the file side, count PTS gaps > 25 ms during known motion (method from serve-sim PR #178). Write both into the take's timeline JSON; a take over budget is re-shot.
  4. **Optional slow-motion capture for hero transitions:** `timeDilation` ("Slows down animations by this factor to help in development", `scheduler/binding.dart`, Flutter 3.47.1). Record a transition at `timeDilation = 4`, then speed the clip up 4x in ffmpeg (`setpts=PTS/4,fps=60`): a 50 ms debug hiccup becomes 12.5 ms and vanishes in the 60 fps resample. Works only for Ticker-driven motion (AnimationController, implicit animations, route transitions, ballistic scroll); timers, `Future.delayed`, fixture streams and `video_player` assets (the app ships `assets/animations/*.mp4`) keep real time and would desync. Use per-shot, not globally. VERIFY.
  5. If a shot still janks: physical iPhone, `flutter drive --profile --no-dds -d <device>`, recorded in QuickTime (section 1.3). No status-bar override on hardware, so hide the bar in-app (2.4).
- **Impeller on the iOS Simulator.** Flutter docs (updated 2026-08-21, https://docs.flutter.dev/perf/impeller): "As of the 3.27 release, Impeller is the default rendering engine for both iOS and Android API 29+" and "Impeller is the only supported rendering engine on iOS with no ability to switch to Skia." Engine source (local 3.47.1, `shell/platform/darwin/ios/rendering_api_selection.mm`): on the Simulator Metal is used when available (Apple Silicon: yes), else software; `--enable-software-rendering` forces software on simulators - never pass it. So shaders behave like the device (no Skia shader-compile jank).
- **Colour on the Simulator vs device** (engine `FlutterDartProject.mm`): `#if TARGET_OS_SIMULATOR ... settings.enable_wide_gamut = false;` ("As of Xcode 14.1, the wide gamut surface pixel formats are not supported by the simulator"); on hardware wide gamut defaults ON (`FLTEnableWideGamut` absent => YES when the hardware supports it). So **Simulator footage is sRGB content**; physical-device footage may contain Display P3 colours and needs a real gamut conversion (3.3).

### 2.2 Frame policy: the current harness would record at ~10 fps
- `IntegrationTestWidgetsFlutterBinding extends LiveTestWidgetsFlutterBinding` and does not set `framePolicy`; the default is `LiveTestWidgetsFlutterBindingFramePolicy.fadePointers` (`flutter_test/lib/src/binding.dart`, 3.47.1).
- In `handleBeginFrame`, a frame is drawn only if the test is expecting one (it called `pump`), or the policy is `fullyLive` / `benchmarkLive` / `benchmark`, or `fadePointers` with a pointer overlay needing paint; otherwise `_HandleDrawFrame.skipFrame`. Tickers do not advance on skipped frames.
- The harness's `_settle()` pumps every 100 ms (`store_captures_test.dart`), so under `fadePointers` **every animation renders at ~10 fps and jumps 100 ms per step.** Fine for stills, unusable for video.
- Policies (doc comments verbatim in the SDK):
  - `fullyLive`: "Show every frame that the framework requests, even if the frames are not explicitly pumped." Also honours pump requests (adds artificial frames).
  - `benchmarkLive`: "Ignore any request from pump but respect other requests to schedule a frame. This is used for running the test on a device, where scheduling of new frames respects what the engine and the device needed." In code, `pump()` under `benchmarkLive` becomes `return delayed(duration ?? Duration.zero);`, i.e. a real-time wait.
  - `benchmark`: ignores framework frame requests, "animation won't run" - never for video.
- **Decision: `binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.benchmarkLive` for every recorded take.** The app then renders exactly like a normal app at the display's vsync, and the existing `_settle(budget)` calls turn into plain real-time waits (so they double as dwell times). `pumpAndSettle` still loops on `hasScheduledFrame` and will still time out on the looping shimmer/charts - keep the fixed-budget waits.
- At the end of the test body the binding calls `runApp(Container(... _postTestMessage))` (binding.dart ~1960), i.e. a "Test finished" screen. **Stop the recorder before the test body returns.**

### 2.3 Clean pixels
- Debug banner: already off - `debugShowCheckedModeBanner: false` at `lib/main.dart:2696` and `lib/core/bootstrap/service_initialization_gate.dart:150` (car_health_ai).
- **Test-pointer crosshairs: on by default in debug and must be removed** (details and source in 1.4). Cleanest fix: a `VideoCaptureBinding extends IntegrationTestWidgetsFlutterBinding` (own `ensureInitialized()`) that overrides `handlePointerEvent` so events arriving with `pointerEventSource == TestBindingEventSource.test` are re-dispatched via `withPointerEventSource(TestBindingEventSource.device, ...)` with `shouldPropagateDevicePointerEvents = true`. Then the ordinary `tester.tap/drag/timedDrag` API keeps working with no overlay, **and that override is the single choke point where every pointer down/move/up can be written to the timeline**. VERIFY on the Simulator (hit-testing, `dispatchEvent` path).
- Status bar: either keep `simctl status_bar override` (9:41, full battery) and crop/mask it in Remotion, or hide it in capture mode (`SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: [])`) so the top inset is plain app background. The safe-area inset stays (it is the hardware island), so layout does not shift. Hiding is the platform-neutral choice and also the only option on a physical iPhone. VERIFY that iOS honours it under this app's `Info.plist` (`UIViewControllerBasedStatusBarAppearance`).
- Pin appearance per shot: `xcrun simctl ui <udid> appearance dark|light`, `content_size large`, and the app-side locale/currency the harness already sets.

### 2.4 Human pacing
- Under `benchmarkLive`, waits are real time, so the script *is* the edit's tempo. Suggested defaults (craft judgement, not a cited standard): tap down-to-up 90-120 ms; 600-900 ms between a screen settling and the next tap ("the user looks, then acts"); 1.5-2.5 s hold on any state the caption talks about; scrolls as `tester.timedDrag` with ~300-500 ms drags or programmatic `ScrollController.animateTo(..., curve: Curves.easeInOutCubic)` for perfectly smooth glides. Record generous holds; Remotion trims, it cannot invent frames.
- Never `pumpAndSettle` in a take; wait on a fixed budget or on a finder appearing (poll every 50 ms with real `Future.delayed`).

### 2.5 Timeline synchronised with the recording's first frame
- Clock: a Dart `Stopwatch` (monotonic) inside the test. Events: pointer down/move/up from the binding override (2.3), route changes from a capture-only `NavigatorObserver`, and explicit `mark('result_visible', caption: ...)` calls in the shot script. For "screen visible" events, timestamp after `await WidgetsBinding.instance.endOfFrame` so the time is when the frame was submitted.
- **Sync flash:** after the recorder reports "Recording started", the test shows a full-screen pure white (or #FF00FF) overlay for 6 frames (100 ms), resets the stopwatch at the `endOfFrame` of the first flash frame (t = 0), removes it, waits 500 ms, then starts the shot. In post, ffmpeg finds the first frame whose mean luma jumps (`signalstats` YAVG > ~235, command in 3.4); `offset = flash_pts`. Every event's video time = `offset + t_event`. Render-to-capture latency is the same for the flash and the events, so it cancels. The flash is trimmed out of every edit.
- **Starting the recorder:** the iOS app cannot spawn processes, but the simulated app is a macOS process that can write to host paths (the harness already writes PNGs straight into the repo via `SKANYX_CAPTURE_OUT`). Use marker files in a shared host directory: test writes `<shot>.armed` -> host script starts `simctl io recordVideo`, waits for "Recording started" on stderr, touches `<shot>.rolling` -> test (polling with real `Future.delayed`) flashes and plays the shot -> test writes `<shot>.cut` -> host sends SIGINT and `wait`s for the file to finalise. One clean file per shot, no dead time. Fallback: one long recording per locale with a flash before every shot (flash *n* = shot *n*).
- Timeline JSON per take (written next to the clip): `{shot, take, locale, device, logicalSize, devicePixelRatio, statusBar: "hidden"|"override", framePolicy, jank: {flutterFramesOver16ms, ptsGapsOver25ms}, sync: {flashFrames: 6}, events: [{t_ms, type: "down"|"up"|"move"|"route"|"mark", x, y, target, name, caption}]}`. Coordinates in logical points; Remotion multiplies by `devicePixelRatio` and subtracts any crop.

## 3. Post-processing the recordings

### 3.1 What Remotion can decode (decides the intermediate codec)
- Remotion "Comparison of video tags" (https://www.remotion.dev/docs/video-tags, undated, read 2026-10-26): `<Video>` from `@remotion/media` "is the recommended component"; it is Mediabunny/WebCodecs based, decodes AAC, FLAC, H.264, MP3, Opus, VP8, VP9, Vorbis and falls back to `<OffthreadVideo>` (Rust + FFmpeg; adds H.265, AV1, AC3, PCM) for unsupported codecs. ProRes row: `<Video>` "Preview & Rendering", `<OffthreadVideo>` "During Rendering", `<Html5Video>` "Not supported".
- Remotion "Supported formats and codecs by Mediabunny" (https://www.remotion.dev/docs/mediabunny/formats, undated; references v4.0.487/4.0.520): "Chrome Headless Shell does not support HEVC in headless mode", so HEVC cannot be decoded by `<Video>` during server-side rendering. ProRes "is not natively supported by WebCodecs and is not enabled by default in @remotion/media".
- Remotion ProRes input (https://www.remotion.dev/docs/videos/prores, needs v4.0.487+): `npx remotion add @mediabunny/prores`, call `registerProresDecoder()` before `registerRoot`; without cross-origin isolation it "falls back to a slower algorithm" (software/WASM decode).
- Remotion performance page (https://www.remotion.dev/docs/performance): "Embedded videos can be a significant bottleneck in Remotion at the moment regardless of which component is being used ... encouraging users to combine Remotion with other tools such as FFmpeg."
- **Conclusion:** simctl's default HEVC is fine as the *archive master*, but must not be what Remotion reads. ProRes 422 HQ would work only through an extra WASM decoder and is ~800 Mb/s at this frame size and rate (Apple's own target is ~220 Mb/s for 1920x1080 at 29.97, June 2014 white paper https://apple.com/support/assets/docs/products/finalcutpro/Apple_ProRes_June_2014.pdf; scale by pixels x fps). **Use high-bitrate H.264 CFR as the Remotion mezzanine** (hardware-decoded by WebCodecs in Studio, native in headless Chrome), keep the raw simctl `.mov` untouched as the master, and use ProRes 422 HQ only as a grading/archive format for B-roll out of Resolve.

### 3.2 VFR -> constant 60 fps (ffmpeg 8.1.1, local man pages)
- `fps` filter: "Convert the video to specified constant frame rate by duplicating or dropping frames as necessary." Options `fps`, `start_time`, `round` (default `near`), `eof_action`.
- `-fps_mode`: `passthrough`, `cfr` ("Frames will be duplicated and dropped to achieve exactly the requested constant frame rate"), `vfr`, `auto`; "`vsync` is deprecated and will be removed in the future." So do not copy old `-vsync 1` recipes.
- Do the CFR conversion with the **filter** (`-vf fps=60`) and keep the muxer out of it (`-fps_mode passthrough`), so frames are resampled once. A VFR screen recording only *repeats* frames when the screen is static, so this adds no blur and no interpolation. Never use `minterpolate` on UI footage (warps text).
- Run sync-flash detection on the **CFR file** (the one Remotion reads), not on the raw VFR master.

### 3.3 Colour: tag, do not shift
- Simulator frames are sRGB content (2.1). sRGB and BT.709 share primaries; the social platforms and Remotion expect BT.709 tags. Colour "shifts" in practice come from (a) untagged files that a player or `swscale` treats as BT.601 (the default matrix for unspecified YUV in many paths), (b) full-range vs limited-range confusion (`yuvj420p`), and (c) real gamut differences (Display P3 device footage, HDR iPhone video).
- Rules: every file entering Remotion carries explicit `bt709` primaries / transfer / matrix and `tv` range; check with `ffprobe -show_entries stream=color_space,color_transfer,color_primaries,color_range`. Use `setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv` to stamp frames and the matching `-color_primaries/-color_trc/-colorspace/-color_range` output options so the container (`colr`/VUI) agrees.
- Only convert pixel values when the source really differs: a physical-iPhone recording carrying Display P3 needs `colorspace=all=bt709:iprimaries=smpte432:itrc=srgb:ispace=bt709` (local `ffmpeg -h filter=colorspace`: `smpte432` = P3-D65 primaries, `iec61966-2-1`/`srgb` transfer). The local Homebrew build has `colorspace`, `lut3d`, `setparams` but **no `zscale`** (no libzimg).
- A sample iPhone screen recording on this machine (`~/Downloads/ScreenRecording_05-11-2026 20-30-49_1.mov`, ffprobe 2026-10-26) is H.264, 480x1044, bt709/bt709/bt709 tv range, r_frame_rate 59, avg 59.0 fps over 20.3 s, with AAC audio: iOS's own recorder tags BT.709 and runs ~60 fps VFR (that file was downscaled somewhere along the way, so it says nothing about native resolution).

### 3.4 Status bar, home indicator and cropping
- Do not crop in ffmpeg. Keep the full frame in the mezzanine and crop/mask in Remotion, driven by numbers in the timeline JSON: write `MediaQuery.viewPaddingOf(context)` (top/bottom insets in logical points) and `devicePixelRatio` into every take's JSON instead of hard-coding them (the iPhone 16 Pro Max inset values are not documented by Apple in a form I could cite; read them from the app).
- Platform-neutral frame = crop top inset (status bar + island area) and bottom inset (the iOS home indicator is drawn by the system over the app and cannot be removed by Flutter alone). If the status bar is hidden in-app (2.3) the top band is plain app background and can stay.
- Aspect: native 1320x2868 is ~9:19.5; a 1080x1920 canvas cannot show it full-bleed without cropping ~18% of height, so plan shots as a phone-in-frame or a punched-in crop of the region that matters (edit decision for the craft doc). Recording at native 3x gives ~1.2x headroom for punch-ins at 1080 wide before upscaling.

### 3.5 Commands
Normalise one take (raw simctl master -> Remotion mezzanine):
```bash
ffmpeg -hide_banner -y -i raw/take.mov \
  -vf "fps=60,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv,format=yuv420p" \
  -fps_mode passthrough -an \
  -c:v libx264 -preset slow -crf 12 -profile:v high -tune animation \
  -x264-params "keyint=30:min-keyint=30:scenecut=0" \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
  -movflags +faststart \
  mezz/take.mp4
```
- `crf 12` is deliberately below the usual "visually lossless" ~17-18 because Remotion zooms and the platforms re-encode again; `-tune animation` suits flat UI; a fixed 0.5 s GOP keeps random access cheap when Remotion seeks; 4:2:0 matches every delivery format. Expected size: tens of Mb/s for busy shots, far less for static UI. (VERIFY that the 1320x2868 portrait H.264 decodes in Remotion Studio's WebCodecs path; if not, scale to 1080 wide here.)
- Find the sync flash (first frame whose mean luma jumps):
```bash
ffmpeg -hide_banner -i mezz/take.mp4 -an \
  -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - 2>/dev/null \
  | awk '/pts_time/{split($0,a,"pts_time:"); t=a[2]} /YAVG/{split($0,b,"="); if (b[2]>200){print t; exit}}'
```
- Jank check on the raw master (PTS gaps during motion): `ffprobe -v error -select_streams v:0 -show_entries frame=pts_time -of csv=p=0 raw/take.mov | awk 'NR>1{d=$1-p; if(d>0.025) n++} {p=$1} END{print n" gaps >25ms"}'` (static stretches also create gaps; compare against the timeline's motion windows).
- B-roll mezzanine after grading (Resolve export or LUT in ffmpeg), timeline rate 30 (see 5): `ffmpeg -i graded.mov -vf "fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 14 -x264-params keyint=15:min-keyint=15:scenecut=0 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv -c:a aac -b:a 256k -movflags +faststart mezz/broll.mp4`.

## 4. Android capture (if Android footage is wanted)

- **`adb shell screenrecord`** (Android Developers "Android Debug Bridge", page updated 2026-09-25, https://developer.android.com/tools/adb): MPEG-4 output; "records at the native display resolution and orientation by default, with a maximum length of three minutes"; `--size WxH` (default native "if supported", else 1280x720; "use a size supported by your device's AVC encoder"); `--bit-rate` default **20 Mbps**; `--time-limit` "default and maximum value is 180"; `--rotate` experimental; `--verbose`. Limitations: no audio; "Some devices might not be able to record at their native display resolution"; rotation mid-recording cuts the picture off. Frames are written when content changes (VFR), so the same `fps=60` normalisation applies. Pull the file with `adb pull` afterwards. (Newer Android builds may accept longer limits; check `adb shell screenrecord --help` on the actual device.)
- **scrcpy** (Genymobile, latest release 5.0.1, "8 October" 2026 per https://github.com/Genymobile/scrcpy/releases; recording doc https://github.com/Genymobile/scrcpy/blob/master/doc/recording.md): `scrcpy --no-playback --no-window --no-audio --record=take.mp4` (or `.mkv`); "Timestamps are captured on the device, so packet delay variation does not impact the recorded file"; optional `--time-limit`; `--video-codec h264|h265|av1` and `--video-bit-rate` (default 8 Mb/s in the older docs, raise to 20-40M for UI). No 3-minute cap documented. **Preferred over screenrecord** for longer takes.
- **Emulator:** `adb emu screenrecord start --time-limit 10 sample_video.webm` records "video and audio from the Android Emulator" to WebM or GIF (https://developer.android.com/studio/run/emulator-record-screen). WebM/VP8-9 decodes in Remotion, but transcode to the same H.264 mezzanine anyway.
- **Flutter on Android:** same limits as iOS: profile mode is "disabled on the emulator" (build-modes doc above), so the emulator is debug-only; a physical Android phone can run `flutter drive --profile --no-dds`. Impeller is default on API 29+ (Vulkan) with OpenGL fallback (Impeller doc, 2026-08-21), so emulator rendering may differ from devices.
- **Clean status bar:** SystemUI demo mode (AOSP doc https://android.googlesource.com/platform/frameworks/base/+/master/packages/SystemUI/docs/demo_mode.md, undated): `adb shell settings put global sysui_demo_allowed 1`; `adb shell am broadcast -a com.android.systemui.demo -e command enter`; `... -e command clock -e hhmm 0941`; `... -e command battery -e level 100`; `... -e command network -e wifi show -e level 4`; `... -e command notifications -e visible false`; exit with `-e command exit`.
- The sync-flash + timeline method (2.5) is platform-independent; on Android the app can write to `getExternalStorageDirectory()`-style paths and the host pulls the JSON with `adb pull` (it cannot write to host paths the way the iOS Simulator app can). Marker-file arming would go through `adb shell` file checks instead.
- Verdict: for marketing, Android footage is only worth it where the UI visibly differs (Material back gesture, Android status bar) or for an "also on Android" beat; the app UI is Flutter and nearly identical, and platform-neutral crops of iOS footage cover both stores (the site's Android traffic is ~2x iOS per CLAUDE.md, so do not show iOS-only chrome such as the Dynamic Island in generic shots).

## 5. Premium B-roll with an iPhone (BMW E60 535d / E61 535)

### 5.1 Camera app and format
- **App: Blackmagic Camera** (free; v3.3 released 2026-04-16 per https://www.sportsvideo.org/2026/04/16/blackmagic-design-releases-blackmagic-camera-for-ios-3-3/). Product page (https://www.blackmagicdesign.com/products/blackmagiccamera, read 2026-10-26): H.264/H.265 and Apple ProRes on iPhone; Apple Log "on supported phones"; manual shutter speed (and shutter-angle mode), ISO, WB presets + manual + lock; histogram, zebras, false colour, focus peaking; 17/33-point 3D LUT preview, a built-in "Apple Log to Rec.709" LUT on newer iPhones, usable for monitoring only or baked in; frame guides incl. **9:16, 1:1, 4:5**; frame rates "from 24 fps up to 120 fps, depending on the phone"; selectable stabilisation levels. The stock Camera app hides shutter and ISO, which is why it reads as "phone video".
- **ProRes / Log on iPhone** (Apple Support "About Apple ProRes on iPhone", published 2026-03-10, https://support.apple.com/109041): ProRes on 13 Pro through 17 Pro; 17 Pro and 16 Pro record ProRes in HDR or Log. 128 GB phones: ProRes 1080p30 max; 256 GB+: 4K at 30/25/24 internally; **4K60 ProRes needs external USB-C storage >= 220 MB/s** (exFAT, 10 Gb/s cable, <= 4.5 W). ProRes files are "up to 30 times larger than HEVC". Enable: Settings > Camera > Formats > Apple ProRes. iPhone 17 Pro adds ProRes RAW, genlock and Apple Log 2 via Final Cut Camera 2.0 (Apple Newsroom 2025-09, https://www.apple.com/cm/newsroom/2025/09/apple-announces-final-cut-camera-2-0/); ProRes RAW is overkill here.
- **HDR off.** Apple iPhone User Guide (https://support.apple.com/en-asia/guide/iphone/adjust-hdr-camera-settings-iph2cafe2ebc/14.0/ios): iPhones record Dolby Vision HDR by default; turn it off at Settings > Camera > Record Video > HDR Video. HLG/Dolby Vision clips dropped into an SDR BT.709 timeline next to screen recordings come out washed or clipped. Either shoot SDR or shoot Log and convert deliberately.
- **Decision:** iPhone 15 Pro or newer -> Blackmagic Camera, **Apple Log, ProRes 422 HQ 4K, 30 fps** (HEVC 10-bit Log if storage is short), monitor through the built-in Log-to-709 LUT, never bake it. Any older iPhone -> Blackmagic Camera, H.265 SDR Rec.709, HDR off. Data: ProRes 422 HQ UHD is ~737 Mb/s at 25p (Wikipedia ProRes table, secondary, https://wikipedia.com/wiki/ProRes), so ~6-7 GB per minute at 30p: shoot short, deliberate takes and offload after each location.
- **Orientation:** shoot **vertical** (phone upright, 9:16 guide on) for social-only shots: 2160x3840 gives 2x headroom on a 1080x1920 canvas for punch-ins and stabilisation crops. Shoot horizontal only for shots also wanted at 16:9 on the website.

### 5.2 Frame rate, shutter, ND
- **30 fps, not 24/25** (reasoning, ours): the screen recordings are 60 fps and the Remotion composition will be 30 or 60. 30 drops cleanly into either; 24 or 25 in a 30/60 timeline produces repeat-frame judder exactly where the cut sits next to perfectly smooth UI. The "cinematic" impression comes from light, depth, motion blur and grade far more than from 24p. Use **60 fps** (shutter 1/120) for hand-detail moments to conform to 30 as 50% slow motion; 120 fps only in strong light.
- **180-degree shutter:** shutter ~ 2 x frame rate, i.e. 1/60 at 30 fps (Moment, "Why Apple's 'Shot on iPhone' Ads Are Misleading", https://www.shopmoment.com/articles/why-apple-s-shot-on-iphone-ads-are-misleading-and-how-a-vnd-fixes-that, vendor source; ProVideo Coalition https://www.provideocoalition.com/get-180-shutter-speed-smartphone-videos/). iPhone apertures are fixed, so in daylight the only way to hold 1/60 is a **variable ND**; without it the phone goes to 1/1000+ and motion looks staccato. Watch for the cross/"X" artefact at the dense end of cheap VNDs.
- **Flicker (Lithuania = 50 Hz mains):** mains-driven lights flicker at 100 Hz; exposures that span whole cycles (1/50, 1/100) are flicker-free, 1/60 can band (https://support.enttec.com/pixel/pixel-general-knowledge/why-do-leds-flicker-on-camera; https://www.scienceabc.com/innovation/why-do-led-lights-flicker-on-camera.html). In garages/streets under mains light at 30 fps use **1/50 (216 deg)**. Car LEDs are PWM-dimmed at their own frequency (100-200 Hz cited for cheap automotive drivers, enttec), so on the dash: turn the instrument-lighting dimmer to maximum (100% duty, VERIFY on the E60), then test 1/50, 1/60, 1/100 and watch the Blackmagic preview for rolling bands before committing.

### 5.3 Exposure, focus, white balance, stabilisation
- Lock everything per shot: ISO (aim <= 400; <= 800 at night, main 1x lens only - the ultra-wide and tele sensors are much noisier in the dark), shutter (5.2), WB in Kelvin (5600 K daylight; ~4000-4500 K at night so amber dash lights stay amber, not orange mush), focus (manual + peaking). Auto WB/exposure that drifts mid-shot is the first thing that reads as amateur.
- Expose with zebras/false colour for the **warning light**: the amber engine symbol must not clip to a white blob.
- Stabilisation: on a gimbal set the app's stabilisation to off/lowest (double stabilisation wobbles); handheld use the standard level, never the most-cropped mode for close-ups.

### 5.4 Light inside a car
- **Blue hour** (roughly the half hour after sunset) for dash and interior shots: the sky still fills the cabin, so the cluster glows without the cabin going black and noisy.
- Practicals do most of the work: the cluster, the phone screen on hands/face, a door courtesy light. Add **one** small bi-colour/RGBWW LED at 5-10%, warm (~3200-4000 K), hidden low in the footwell or bounced off the headliner; never aimed at glass.
- Reflections: dark clothing, cabin lights off unless motivated, black cloth over the dash top when filming through the windshield, a CPL for through-glass daylight shots, and angle the filmed phone so it does not mirror the LED.
- **Filming a phone screen:** set the filmed phone to a fixed high brightness (auto-brightness off) so it does not pump; moiré appears when the screen's pixel grid is sharp and frontal. iPhones cannot stop down (fixed aperture), so use a slight angle, a little distance, or a hair of defocus (Divoom guide, https://divoom.com/blogs/setup-ideas/reduce-moire-filming-pixel-led-screen; ProVideo Coalition https://www.provideocoalition.com/tip-stop-down-to-erase-moire/). For hero shots, **replace the screen**: film with the real app on screen (or plain dark screen), track the four corners with the **Planar Tracker in DaVinci Resolve's Fusion page, which is in the free version** (Camera Tracker is Studio-only; DaVinci Resolve Club, updated 2026-09, https://davinciresolveclub.com/fusion-tracking-davinci-resolve/), and corner-pin the clean simctl recording. For a locked-off shot Remotion can do the corner pin itself (CSS `matrix3d` from 4 measured corners).
- **The OBD port shot:** on the E60/E61 the port is under the driver-side dash behind a small flip-down cover on the kick-panel side (ObdAdvisor https://obdadvisor.com/obd2-port-locator/bmw/5-series/; Cobb Tuning for N54/N55 E60 https://cobbtuning.atlassian.net/wiki/spaces/PRS/pages/3021570121/BMW+OBD+Port+Location; VERIFY on both team cars). Shoot from the open driver's door sill or the passenger footwell, low angle, LED at 5-10% bounced, 60 fps for the insertion, hold 2 s before and after, and **record the click** (real foley sells authenticity).

### 5.5 Grading on a budget
- **DaVinci Resolve 21 (free)** - released June 2026, 21.1 in Sept 2026 (PetaPixel 2026-06-03 https://petapixel.com/2026/06/03/davinci-resolve-21-officially-released-with-new-photo-editing-ai-tools/; SVG 2026-09-09 https://www.sportsvideo.org/2026/09/09/ibc-2026-blackmagic-design-releases-davinci-resolve-21-1/; Studio is $295 one-time per Videomaker). Grade Log with a **Color Space Transform** (Apple Log -> DaVinci Wide Gamut/Intermediate, grade, CST -> Rec.709 Gamma 2.4) rather than a single LUT; Apple Log 2 (17 Pro) uses Apple Wide Gamut and needs its own input setting, and Rec.2020-based Apple Log LUTs oversaturate it (Gamut.io, vendor blog, https://gamut.io/the-sandwich-method-proper-cst-for-apple-log-2-in-davinci-resolve/). Save one **show PowerGrade** and apply it to every B-roll shot; never grade the app recordings (the UI must look like the real app).
- Apple's own Log-to-709 LUT is a developer-site download; forum users report poor skin tones on 16 Pro footage (Apple Developer forums / Blackmagic forum, https://forum.blackmagicdesign.com/viewtopic.php?p=1052853). Hands are the only skin in our shots, so this matters less, but CST is the safer default.
- **Mac gamma trap:** Resolve's Rec.709 Gamma 2.4 exports tagged 1-1-1 look washed out in QuickTime/Apple frameworks; Resolve 16.2.2+ offers "Rec.709-A" for Apple-compatible 1-1-1 files (Blackmagic forum announcement https://forum.blackmagicdesign.com/viewtopic.php?p=629393; explanation thread https://forum.blackmagicdesign.com/viewtopic.php?p=604914). Since Remotion renders in Chrome and the platforms re-encode as 1-1-1, pick one export setting, render a test frame through Remotion next to a screen recording, and lock it (VERIFY).
- Batch alternative without Resolve: `ffmpeg -i clip.mov -vf "lut3d=file=applelog_to_709.cube,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv,fps=30,format=yuv420p" ...` (local ffmpeg 8.1.1 has `lut3d` with tetrahedral interpolation). Good for dailies, not for the hero grade.

### 5.6 What makes small-team footage look premium (craft notes, ours)
Control the light (blue/golden hour, motivated practicals); give every frame depth (a foreground edge: steering-wheel rim, door frame, seat bolster); move slowly and on purpose (gimbal push-ins, locked-off tripod shots, no handheld wobble); 180-degree motion blur; locked exposure/WB; one consistent grade; real textures and real sound; fewer, longer, better takes. The fastest tells of "amateur" are exposure pumping, WB shifts, digital zoom, ultra-wide distortion up close and shaky handheld. The fastest tells of "AI-made" are things that never happened: keep every B-roll moment a real event on the team's own cars.
- Honesty flag for the edit: the app's capture fixtures show a BMW X5 and a 2014 530d (`capture_scene.dart`), while the filmed cars are an E60 535d and an E61 535. A cut from "adapter goes into this E60" to a screen reading another car's data implies a read that did not happen; either set the demo fixture to the filmed car or never cut them as cause-and-effect (hand to the disclosure/legal doc).

### 5.7 Reusable shot list (car-diagnostics stories)
| # | Shot | Framing / lens | Move | fps | Sound |
|---|---|---|---|---|---|
| 1 | Car parked at blue hour, wide | 9:16, 1x, low | slow gimbal push-in 3-4 s | 30 | ambience |
| 2 | Start button / key turn, close | 1x close | static | 60 | click + chime |
| 3 | Cluster bulb-check sweep, then the amber engine light stays | 1x macro-ish, over the wheel | rack focus wheel rim -> cluster | 30 | engine idle |
| 4 | Driver's hands tighten on the wheel / glance down (no face needed) | over-the-shoulder | static | 30 | - |
| 5 | Phone lights the footwell; hand lowers the adapter | sill or passenger-footwell, low | slow tilt down | 60 | rustle |
| 6 | Adapter seats in the port; its LED blinks | 2x close | locked | 60 | **the click** |
| 7 | Phone in hand, thumb taps (screen replaced in post) | over-the-shoulder, phone in lower third | static/gimbal | 30 | tap |
| 8 | Phone and cluster in one frame | 1x | rack focus phone <-> light | 30 | - |
| 9 | Driving POV through the windshield | suction mount, 1x | car motion | 30 | road |
| 10 | Exterior pass-by / rolling | roadside, tripod | pan | 30 | pass-by |
| 11 | Bonnet open, M57 engine cover, hand points | 1x | slow push | 30 | bonnet latch |
| 12 | Resolution: cluster clear, phone in cup holder showing the result | 1x | static | 30 | calm |
| 13 | Used-car buyer variant: keys handed over, adapter into someone else's car | 1x | handheld-on-gimbal | 30 | dialogue-free |
Cover each story with 1-3-5-6-7-12 at minimum; shoot every shot 3 takes, 6-10 s each, with 2 s handles.

### 5.8 Gear list (rough prices, retailer listings 2026; verify before buying)
| Item | Pick | Price |
|---|---|---|
| Variable ND for iPhone | Neewer CPL + VND 2-32 kit (magnetic backplate) / Moment QuickLock 2-7 stop / SANDMARC Motion VND 3-6 stop | $49.99 / $90 / $99.99 (https://neewer.com/products/neewer-cpl-variable-nd-filter-compatible-with-iphone-17-pro-17-pro-max-66610156, https://www.adorama.com/moment-quicklock-2-7-stop-nano-coated-variable-nd-filter/p/mobvar, https://www.sandmarc.com/collections/iphone-12-pro-max-lens/products/motion-variable-nd-filter-iphone) |
| Small LED | Aputure MC Pro (RGBWW, 2000-10000 K, magnetic, IP65) | ~$159 (https://hotrodcameras.com/aputure-mc-pro-rgb-portable-film-light) |
| Gimbal | DJI Osmo Mobile 8 | $149 list, $125-134 street (Amazon/Newegg 2026 per https://slickdeals.net/f/19307595-126-dji-osmo-mobile-8-gimbal-stabilizer-for-smartphones-at-amazon) |
| Car mounts | suction-cup mount + magic arm + phone clamp/cage (SmallRig/Ulanzi class) | ~$40-100 total (not sourced; check) |
| Mini tripod | any phone tripod with clamp | ~$20-40 (not sourced) |
| Flags | black cloth, gaffer tape, small foam board for bounce | ~$20 |
| External SSD | only for 4K60 ProRes: >= 220 MB/s, exFAT, <= 4.5 W (Apple) | ~$80-120 for 1 TB (not sourced) |
| Software | Blackmagic Camera, DaVinci Resolve 21, ffmpeg | free |
Rough total: ~$450-650.

## 6. Asset management in a studio repo

### 6.1 Git LFS vs gitignored media + manifest + external storage
- **Git LFS on GitHub** (https://docs.github.com/en/billing/concepts/product-billing/git-lfs, read 2026-10-26): billing is now **metered** (prepaid data packs removed); free quota for GitHub Free organisations is 10 GiB storage + 10 GiB bandwidth per month (Team/Enterprise 250/250); "When you commit and push a change to a Git LFS file, a new version of the entire file is pushed and the total file size is included in the repository owner's storage use"; with a $0 budget LFS is blocked for the rest of the month once the quota is used. Third-party guides cite per-file caps of 2 GB on Free/Pro (https://fast.io/resources/git-lfs-limit.md, unverified).
- Our volumes: one minute of 4K30 ProRes 422 HQ is ~6-7 GB; a single B-roll shoot is tens of GB; screen-recording masters are small (MBs) but multiply by 14 locales x takes. **LFS would be exhausted by one shoot and charges again for every re-export.** Not a fit for raw media.
- **Cloudflare R2** (pricing page updated 2026-10-01, https://developers.cloudflare.com/r2/pricing/): Standard storage $0.015/GB-month (Infrequent Access $0.01), **egress free**, free tier 10 GB-month + 1M Class A + 10M Class B ops/month. The company already runs on Cloudflare, so no new vendor. 300 GB of masters is ~$4.50/month.
- **Remotion and big files:** `npx remotion bundle --public-dir <dir>` / `bundle({publicDir})` choose the public folder; the bundler *copies* it (the docs suggest warning users when the folder is large because copying is slow), but **symlinks inside `public/` are forwarded, not resolved** (`onSymlinkDetected`; "if the original link target is deleted, the bundle breaks") (https://remotion.dev/docs/bundle, read 2026-10-26). So link `remotion/public/media -> ../../media/mezz` instead of copying gigabytes per render.
- **Decision:** no LFS. `media/` is gitignored and synced to an R2 bucket with `rclone` (S3 API). A tracked **manifest** is the source of truth. Small, slow-changing binary assets that the code needs on every checkout (fonts, logo SVGs, LUT `.cube` files, licensed SFX under a few MB) go straight into git without LFS.

### 6.2 Layout
```
studio/
  remotion/                       # tracked: compositions, components, timeline loaders
    public/media -> ../../media/mezz      # symlink, gitignored target
  capture/                        # tracked: record.sh, normalise.sh, find-flash.sh, ingest.py
  shots/                          # tracked: one spec per shot (id, story, locales, dwell times, captions)
  manifests/
    media.jsonl                   # tracked: one JSON object per file (see below)
  luts/                           # tracked: show LUT / PowerGrade exports (.cube, .drx)
  media/                          # GITIGNORED, mirrored to r2://skanyx-studio/
    raw/
      rec/ios/<shot>/<locale>/<shot>_<locale>_t<NN>.mov        # simctl master, never edited
      rec/ios/<shot>/<locale>/<shot>_<locale>_t<NN>.timeline.json
      rec/android/...
      broll/<YYYY-MM-DD>_<car>-<place>/<YYYY-MM-DD>_<car>-<place>_<shot-slug>_t<NN>.mov
      vo/<script-id>/<script-id>_<locale>_<voice-slug>_t<NN>.wav
      music/<track-slug>.<ext>    # with licence file next to it
      sfx/<sfx-slug>.wav
    mezz/                         # derived (H.264 CFR), reproducible from raw + capture scripts
      rec/... same names .mp4
      broll/... same names .mp4 (graded)
    renders/<YYYY-MM-DD>/<video-id>_<locale>_<platform>_<W>x<H>_<fps>fps_v<NN>.mp4
```
### 6.3 Naming rules
- Lowercase ASCII, `-` inside a field, `_` between fields, ISO dates `YYYY-MM-DD`, zero-padded `tNN` takes and `vNN` render versions, no spaces (simctl/ffmpeg/shell safety). Field order: *what*, *variant*, *take*. Examples: `scan-p0420_de_t03.mov`; `2026-11-02_e60-garage_obd-plug_t02.mov`; `p0420-panic_en_vo-ana_t01.wav`; `p0420-panic_de_tiktok_1080x1920_30fps_v03.mp4`.
- Rename camera files on ingest (Remotion code references stable IDs); keep the camera's original filename (`IMG_1234.MOV` / `A001_...`) in the manifest so the source is traceable.
- Locale codes = the app's capture directory names (`en, de, es, fr, hu, lt, nl, pl, pt-BR, pt-PT, ro, sl, tr, uk`) so app and studio agree.
### 6.4 Manifest fields (`manifests/media.jsonl`)
`id, path, kind (rec|broll|vo|music|sfx|mezz|render), sha256, bytes, duration_s, width, height, fps, codec, color {primaries, trc, matrix, range}, source {device, app_build, git_commit, locale, shot, take, original_name}, recorded_at, people_consent (none|crew|signed), privacy {plate_visible, vin_visible, faces}, licence, status (select|alt|reject), derived_from, r2_key`. `ingest.py` fills the technical fields from ffprobe and refuses a file without colour tags. Flag privacy: a windscreen VIN plate or a number plate in B-roll must be blurred before publishing.

---

## Decisions for the studio

### D1. Screen-recording route
- **Primary: iOS Simulator (iPhone 16 Pro Max, native 1320x2868) + `xcrun simctl io recordVideo --codec=hevc --mask=ignored`**, one file per take, driven by `flutter drive` in debug with the store-capture fixtures. The recorder is not the bottleneck (serve-sim PR #178 measurements); app-side determinism is.
- **Hero fallback:** physical iPhone, `flutter drive --profile --no-dds -d <device>`, recorded over USB in QuickTime, status bar hidden in-app; use only for a shot that still janks on the Simulator after warm-up.
- Touches are **drawn in Remotion** from the timeline, never captured.
- Android only for platform-specific beats: `scrcpy --no-playback --no-window --no-audio --record=take.mp4` + SystemUI demo mode.

### D2. Recording script (sketch for `capture/record.sh`; replaces `open -a Simulator`)
```bash
UDID=...; SYNC="$PWD/media/raw/rec/.sync"; mkdir -p "$SYNC"
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b
# Xcode 27 has no Simulator.app (DeviceHub.app instead); simctl does not need a window (VERIFY)
xcrun simctl status_bar "$UDID" override --time "9:41" --batteryState discharging \
  --batteryLevel 100 --cellularBars 4 --wifiBars 3 --operatorName ''
xcrun simctl ui "$UDID" appearance dark          # or light, per shot spec
flutter drive --driver=test_driver/integration_test.dart \
  --target=integration_test/video_takes_test.dart \
  --dart-define=SKANYX_STORE_CAPTURE=true \
  --dart-define=SKANYX_VIDEO_SYNC_DIR="$SYNC" \
  --dart-define=SKANYX_VIDEO_SHOTS=scan-p0420 \
  --dart-define=SKANYX_CAPTURE_LOCALES=en -d "$UDID" &
DRIVE=$!
while kill -0 "$DRIVE" 2>/dev/null; do
  for armed in "$SYNC"/*.armed; do
    [ -e "$armed" ] || continue
    name="$(basename "$armed" .armed)"; rm "$armed"            # e.g. scan-p0420_en_t01
    out="media/raw/rec/ios/${name%%_*}/$(echo "$name" | cut -d_ -f2)/$name.mov"; mkdir -p "$(dirname "$out")"
    xcrun simctl io "$UDID" recordVideo --codec=hevc --mask=ignored --force "$out" 2>"$out.rec.log" &
    REC=$!
    until grep -q "Recording started" "$out.rec.log"; do sleep 0.05; done
    touch "$SYNC/$name.rolling"
    until [ -e "$SYNC/$name.cut" ]; do sleep 0.05; done
    kill -INT "$REC"; wait "$REC"                               # simctl finalises the file before exiting
    rm -f "$SYNC/$name.cut" "$SYNC/$name.rolling"
    mv "$SYNC/$name.timeline.json" "${out%.mov}.timeline.json" 2>/dev/null || true
  done
  sleep 0.1
done
wait "$DRIVE"
```

### D3. Flutter binding settings (sketch for `integration_test/video_takes_test.dart`)
```dart
class VideoCaptureBinding extends IntegrationTestWidgetsFlutterBinding {
  final Stopwatch clock = Stopwatch();
  final List<Map<String, Object?>> events = <Map<String, Object?>>[];

  @override
  void handlePointerEvent(PointerEvent event) {
    if (pointerEventSource != TestBindingEventSource.test) {
      super.handlePointerEvent(event);
      return;
    }
    if (clock.isRunning && (event is PointerDownEvent || event is PointerUpEvent || event is PointerMoveEvent)) {
      events.add(<String, Object?>{
        't_ms': clock.elapsedMicroseconds / 1000.0,
        'type': event is PointerDownEvent ? 'down' : event is PointerUpEvent ? 'up' : 'move',
        'x': event.position.dx, 'y': event.position.dy,   // logical points
      });
    }
    // Re-dispatch as a device event: no debug crosshair is painted on this path.
    final bool previous = shouldPropagateDevicePointerEvents;
    shouldPropagateDevicePointerEvents = true;
    try {
      withPointerEventSource(TestBindingEventSource.device, () => super.handlePointerEvent(event));
    } finally {
      shouldPropagateDevicePointerEvents = previous;   // the binding verifies this is restored after the test
    }
  }
}

void main() {
  final VideoCaptureBinding binding = VideoCaptureBinding();   // must be created before anything touches a binding
  binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.benchmarkLive;
  // per take: warm-up pass (unrecorded) -> reset state -> write <name>.armed -> poll for <name>.rolling
  // -> insert a full-screen white OverlayEntry on rootNavigatorKey for 6 frames; at the first
  //    endOfFrame: binding.clock..reset()..start(); remove it; wait 500 ms
  // -> play the shot with human dwell times (2.4); log route changes (NavigatorObserver) and mark(...)
  // -> addTimingsCallback jank counter; MediaQuery.viewPadding + devicePixelRatio into the JSON
  // -> write <name>.timeline.json, then <name>.cut; stop before the test body returns.
}
```
- Keep `debugShowCheckedModeBanner: false` (already set). Never pass `--enable-software-rendering`. Never `pumpAndSettle` inside a take.

### D4. ffmpeg normalisation (raw master -> Remotion mezzanine) and sync
```bash
ffmpeg -hide_banner -y -i "$RAW" \
  -vf "fps=60,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv,format=yuv420p" \
  -fps_mode passthrough -an -c:v libx264 -preset slow -crf 12 -profile:v high -tune animation \
  -x264-params "keyint=30:min-keyint=30:scenecut=0" \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv -movflags +faststart "$MEZZ"
# flash offset in the CFR file:
ffmpeg -hide_banner -i "$MEZZ" -an -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - 2>/dev/null \
  | awk '/pts_time/{split($0,a,"pts_time:"); t=a[2]} /YAVG/{split($0,b,"="); if (b[2]>200){print t; exit}}'
```
Remotion: video time of an event = `flash_offset_s + t_ms/1000`; crop from `viewPadding`; draw touch rings from `down`/`up`. Master stays HEVC VFR in `raw/`; Remotion only ever reads `mezz/` H.264.

### D5. B-roll camera settings (Blackmagic Camera)
| Setting | Value |
|---|---|
| Lens | 1x main camera for anything dim; 2x/tele only in good light |
| Resolution / orientation | 4K, **vertical** (2160x3840), 9:16 guide on |
| Codec | iPhone 15 Pro+: ProRes 422 HQ, **Apple Log** (HEVC 10-bit Log if storage short); older: H.265 SDR Rec.709 |
| HDR | Off (stock Camera: Settings > Camera > Record Video > HDR Video off) |
| Frame rate | **30** (match the Remotion composition exactly); 60 for hand-detail slow motion |
| Shutter | 1/60 (180 deg); **1/50** under 50 Hz mains light or if the cluster bands; 1/120 at 60 fps |
| ND | variable ND to hold the shutter in daylight |
| ISO | locked, <= 400 day, <= 800 night |
| WB | locked Kelvin: 5600 K day, ~4000-4500 K night |
| Focus / exposure | manual focus + peaking; zebras/false colour so the warning light never clips |
| Stabilisation | off/lowest on the gimbal; standard handheld |
| Monitoring | built-in Apple Log -> Rec.709 LUT for preview only, not baked |
| Audio | always record (foley: adapter click, ignition, door) |
| Grade | Resolve 21 free: CST Apple Log -> DWG/DI -> grade -> CST Rec.709; one show PowerGrade; export test through Remotion to settle Rec.709 vs Rec.709-A |

### D6. Gear: see 5.8 (VND, Aputure MC Pro-class LED, Osmo Mobile 8, suction mount + magic arm, mini tripod, black cloth/gaffer; SSD only for 4K60 ProRes). ~$450-650.
### D7. Shot list: see 5.7 (13 reusable shots; minimum per story 1-3-5-6-7-12).
### D8. Asset layout: see 6.2-6.4 (gitignored `media/` mirrored to Cloudflare R2 with rclone, tracked `manifests/media.jsonl`, no Git LFS, `remotion/public/media` symlink to `media/mezz`).

---

## Uncertain / verify (test on this machine before building the pipeline)
1. **`open -a Simulator` on Xcode 27.1:** Simulator.app is gone (DeviceHub.app). Does `store_captures.sh` still run (it uses `set -e`)? Does `simctl recordVideo` record a booted device with no Device Hub window open?
2. **simctl frame cadence on the M4 Pro / iPhone 16 Pro Max simulator:** record a continuous 3 s animation and list PTS deltas (`ffprobe -show_entries frame=pts_time`). Is it 60 Hz, 120 Hz, or the "30 fps" RocketSim's author describes? Check resolution (expect 1320x2868), colour tags, and bitrate for `--codec hevc` vs `h264`; zoom a gradient and small text 2x.
3. Does `--mask=ignored` produce a plain rectangle with no Dynamic Island cut-out, and does the status-bar override survive in the recording?
4. **`VideoCaptureBinding`:** taps land where `tester.tap` would, no crosshair appears, the post-test invariant check passes, and `Future.delayed` polling of marker files works under `benchmarkLive`.
5. `benchmarkLive` in practice: does any screen rely on `pump()` to advance (e.g. fixture timers paced by `_settle`)? Do shimmer/chart screens look right at native vsync?
6. Debug-mode jank on this Mac: run each flow twice and compare dropped-frame counts (timings callback + PTS gaps) between the warm-up and recorded passes.
7. The sync flash: threshold on YAVG, and that flash-to-event offsets match within 1 frame (tap a widget that changes colour instantly and compare).
8. Hiding the iOS status bar from Flutter in capture mode under the app's `Info.plist`.
9. `timeDilation` slow-capture trick on a route transition: does any fixture stream or `video_player` asset desync?
10. Remotion: `@remotion/media` `<Video>` decoding a 1320x2868 portrait H.264 (Level 5.1) in Studio and in render; seek cost with keyint 30; whether to scale mezzanines to 1080 wide.
11. Physical iPhone via QuickTime: resolution, frame rate, colour tags (Display P3? the engine enables wide gamut on hardware by default) and whether the P3 -> BT.709 `colorspace` step is needed. Also whether Device Hub can record a physical iOS 27 device.
12. On both cars: OBD port position/cover on the E60 535d and E61 535, instrument-lighting dimmer at max, and which shutter (1/50, 1/60, 1/100) shows no banding on the cluster and on the filmed phone's OLED.
13. Which iPhones the team owns (Log/ProRes needs 15 Pro+, 4K ProRes internal needs 256 GB+).
14. Resolve 21: Apple Log 2 input option in the CST, and which export tag (Rec.709 vs Rec.709-A) matches the simctl footage once both pass through Remotion/Chrome.
15. The Remotion composition fps (01-remotion research) - B-roll fps must equal it (or be a clean multiple).
16. Android only if needed: `adb shell screenrecord --help` limits on the actual device; scrcpy 5.0.1 recording quality.
