/**
 * The app capture harness writes `<take>.taps.json` next to each recording:
 * every pointer down/up and every screen change, timed on a monotonic clock
 * that starts when the take's sync flash is shown. The normaliser finds the
 * flash in the video and stores `flashOffsetMs`; from then on
 * video time = flashOffsetMs + event time.
 *
 * Coordinates are in the app's logical pixels (`viewPadding` already removed)
 * and are mapped to the recording's pixel size through `logicalSize`.
 */
import { z } from "zod";

export const tapEventSchema = z.object({
  t: z.number().describe("ms since the sync flash"),
  type: z.enum(["down", "up", "screen", "note"]),
  x: z.number().optional(),
  y: z.number().optional(),
  /** Route or screen name for `screen` events; free text for `note`. */
  label: z.string().optional(),
});

export const tapTimelineSchema = z.object({
  version: z.literal(1),
  take: z.string(),
  flow: z.string(),
  locale: z.string(),
  device: z.string(),
  /** Logical size of the app view that the coordinates refer to. */
  logicalSize: z.object({ width: z.number(), height: z.number() }),
  /** Native pixel size of the recording. */
  pixelSize: z.object({ width: z.number(), height: z.number() }),
  /** Set by the normaliser once the flash frame is found. */
  flashOffsetMs: z.number().optional(),
  /** Frames the app reported as janky during the take (re-shoot above ~2). */
  jankyFrames: z.number().optional(),
  events: z.array(tapEventSchema),
});

export type TapEvent = z.infer<typeof tapEventSchema>;
export type TapTimeline = z.infer<typeof tapTimelineSchema>;

export type Tap = { videoMs: number; x: number; y: number; durationMs: number };

/** Pair down/up events into taps in RECORDING pixel space, video-timed. */
export const tapsFromTimeline = (tl: TapTimeline): Tap[] => {
  const offset = tl.flashOffsetMs ?? 0;
  const sx = tl.pixelSize.width / tl.logicalSize.width;
  const sy = tl.pixelSize.height / tl.logicalSize.height;
  const taps: Tap[] = [];
  let open: TapEvent | null = null;
  for (const e of tl.events) {
    if (e.type === "down") open = e;
    if (e.type === "up" && open && open.x !== undefined && open.y !== undefined) {
      taps.push({
        videoMs: offset + open.t,
        x: open.x * sx,
        y: open.y * sy,
        durationMs: Math.max(80, e.t - open.t),
      });
      open = null;
    }
  }
  return taps;
};

export type ScreenChange = { videoMs: number; label: string };

export const screensFromTimeline = (tl: TapTimeline): ScreenChange[] =>
  tl.events
    .filter((e) => e.type === "screen" && e.label)
    .map((e) => ({ videoMs: (tl.flashOffsetMs ?? 0) + e.t, label: e.label as string }));

/** Frame index in a composition of `fps` for a video time (clip starts at `clipStartFrame`). */
export const frameForVideoMs = (videoMs: number, fps: number, clipStartFrame = 0): number =>
  clipStartFrame + Math.round((videoMs / 1000) * fps);
