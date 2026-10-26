import { describe, expect, it } from "vitest";
import { frameForVideoMs, screensFromTimeline, tapTimelineSchema, tapsFromTimeline } from "../tap-timeline";

const timeline = tapTimelineSchema.parse({
  version: 1,
  take: "scan-01",
  flow: "scan",
  locale: "en",
  device: "iPhone 16 Pro Max",
  logicalSize: { width: 440, height: 956 },
  pixelSize: { width: 1320, height: 2868 },
  flashOffsetMs: 500,
  events: [
    { t: 0, type: "screen", label: "home" },
    { t: 1200, type: "down", x: 220, y: 800 },
    { t: 1320, type: "up", x: 220, y: 800 },
    { t: 1900, type: "screen", label: "scan" },
    { t: 2500, type: "down", x: 100, y: 100 },
  ],
});

describe("tap timeline", () => {
  it("pairs down/up into taps, scaled to recording pixels and offset by the flash", () => {
    const taps = tapsFromTimeline(timeline);
    expect(taps).toHaveLength(1);
    expect(taps[0]).toEqual({ videoMs: 1700, x: 660, y: 2400, durationMs: 120 });
  });

  it("lists screen changes in video time", () => {
    expect(screensFromTimeline(timeline)).toEqual([
      { videoMs: 500, label: "home" },
      { videoMs: 2400, label: "scan" },
    ]);
  });

  it("maps video time to a composition frame", () => {
    expect(frameForVideoMs(1700, 30)).toBe(51);
    expect(frameForVideoMs(1700, 30, 90)).toBe(141);
  });

  it("rejects a timeline with an unknown event type", () => {
    expect(() => tapTimelineSchema.parse({ ...timeline, events: [{ t: 0, type: "swipe" }] })).toThrow();
  });
});
