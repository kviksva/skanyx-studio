/**
 * Delivery spec for a final master and the judge that compares an ffprobe
 * reading against it. Pure, unit-tested; scripts/qa.ts runs ffprobe.
 */
export type ProbeSummary = {
  width: number;
  height: number;
  /** Average frame rate as a number, e.g. 30 or 29.97. */
  fps: number;
  /** True when r_frame_rate equals avg_frame_rate (constant frame rate). */
  constantFrameRate: boolean;
  videoCodec: string;
  profile: string;
  pixFmt: string;
  colorPrimaries?: string;
  colorTransfer?: string;
  colorSpace?: string;
  audioCodec?: string;
  audioSampleRate?: number;
  audioChannels?: number;
  durationS: number;
};

export const deliverySpec = {
  width: 1080,
  height: 1920,
  fps: [30, 25] as const,
  videoCodec: "h264",
  profile: "High",
  pixFmt: "yuv420p",
  color: "bt709",
  audioCodec: "aac",
  audioSampleRate: 48000,
  audioChannels: 2,
  minDurationS: 20,
  maxDurationS: 40,
} as const;

export const judgeSpec = (p: ProbeSummary, s = deliverySpec): string[] => {
  const problems: string[] = [];
  if (p.width !== s.width || p.height !== s.height) problems.push(`size ${p.width}x${p.height}`);
  if (!s.fps.some((f) => Math.abs(p.fps - f) < 0.01)) problems.push(`fps ${p.fps}`);
  if (!p.constantFrameRate) problems.push("variable frame rate");
  if (p.videoCodec !== s.videoCodec) problems.push(`video codec ${p.videoCodec}`);
  if (p.profile !== s.profile) problems.push(`profile ${p.profile}`);
  if (p.pixFmt !== s.pixFmt) problems.push(`pixel format ${p.pixFmt}`);
  for (const [k, v] of [
    ["primaries", p.colorPrimaries],
    ["transfer", p.colorTransfer],
    ["matrix", p.colorSpace],
  ] as const) {
    if (v !== s.color) problems.push(`colour ${k} ${v ?? "untagged"}`);
  }
  if (p.audioCodec !== s.audioCodec) problems.push(`audio codec ${p.audioCodec ?? "none"}`);
  if (p.audioSampleRate !== s.audioSampleRate) problems.push(`audio ${p.audioSampleRate ?? "?"} Hz`);
  if (p.audioChannels !== s.audioChannels) problems.push(`audio channels ${p.audioChannels ?? "?"}`);
  if (p.durationS < s.minDurationS || p.durationS > s.maxDurationS) {
    problems.push(`duration ${p.durationS.toFixed(1)} s (${s.minDurationS}-${s.maxDurationS})`);
  }
  return problems;
};
