import { describe, expect, it } from "vitest";
import { judgeLoudness, parseEbur128, parseLoudnormJson } from "../loudness";

describe("parseLoudnormJson", () => {
  it("reads the pass-1 measurement block out of ffmpeg stderr", () => {
    const stderr = `
[Parsed_loudnorm_0 @ 0x1]
{
	"input_i" : "-21.34",
	"input_tp" : "-3.10",
	"input_lra" : "6.20",
	"input_thresh" : "-31.60",
	"output_i" : "-14.01",
	"output_tp" : "-1.50",
	"output_lra" : "6.10",
	"output_thresh" : "-24.20",
	"normalization_type" : "linear",
	"target_offset" : "0.02"
}
`;
    expect(parseLoudnormJson(stderr)).toEqual({
      input_i: -21.34,
      input_tp: -3.1,
      input_lra: 6.2,
      input_thresh: -31.6,
      target_offset: 0.02,
      normalization_type: "linear",
    });
  });

  it("throws when the block is missing", () => {
    expect(() => parseLoudnormJson("nothing here")).toThrow();
  });
});

describe("parseEbur128 + judgeLoudness", () => {
  const summary = `
[Parsed_ebur128_0 @ 0x1] Summary:

  Integrated loudness:
    I:         -14.2 LUFS
    Threshold: -24.8 LUFS

  Loudness range:
    LRA:         6.4 LU
    Threshold: -34.9 LUFS
    LRA low:   -18.6 LUFS
    LRA high:  -12.2 LUFS

  True peak:
    Peak:       -1.4 dBFS
`;
  it("parses the summary and passes a master inside the targets", () => {
    const m = parseEbur128(summary);
    expect(m).toEqual({ integratedLufs: -14.2, truePeakDbtp: -1.4, lra: 6.4 });
    expect(judgeLoudness(m).ok).toBe(true);
  });

  it("fails a master that is too quiet or peaks too hot", () => {
    expect(judgeLoudness({ integratedLufs: -16, truePeakDbtp: -2, lra: 6 }).problems).toHaveLength(1);
    expect(judgeLoudness({ integratedLufs: -14, truePeakDbtp: -0.3, lra: 6 }).problems).toHaveLength(1);
  });
});
