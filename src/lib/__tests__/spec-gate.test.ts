import { describe, expect, it } from "vitest";
import { judgeSpec, type ProbeSummary } from "../spec-gate";

const good: ProbeSummary = {
  width: 1080,
  height: 1920,
  fps: 30,
  constantFrameRate: true,
  videoCodec: "h264",
  profile: "High",
  pixFmt: "yuv420p",
  colorPrimaries: "bt709",
  colorTransfer: "bt709",
  colorSpace: "bt709",
  audioCodec: "aac",
  audioSampleRate: 48000,
  audioChannels: 2,
  durationS: 28.4,
};

describe("judgeSpec", () => {
  it("passes a compliant master", () => {
    expect(judgeSpec(good)).toEqual([]);
  });

  it("names every deviation", () => {
    const problems = judgeSpec({
      ...good,
      fps: 29.97,
      constantFrameRate: false,
      colorSpace: undefined,
      audioSampleRate: 44100,
      durationS: 61,
    });
    expect(problems).toEqual([
      "fps 29.97",
      "variable frame rate",
      "colour matrix untagged",
      "audio 44100 Hz",
      "duration 61.0 s (20-40)",
    ]);
  });

  it("accepts 25 fps for B-roll shot under 50 Hz light", () => {
    expect(judgeSpec({ ...good, fps: 25 })).toEqual([]);
  });
});
