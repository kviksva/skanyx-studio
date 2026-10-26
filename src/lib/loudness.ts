/**
 * Parsers for ffmpeg's loudnorm (pass 1 JSON) and ebur128 (gate) output, and
 * the delivery targets. Pure functions so they are unit-tested; the ffmpeg
 * invocations live in scripts/audio/mix.ts and scripts/qa.ts.
 */
export const loudnessTarget = {
  integratedLufs: -14,
  truePeakDbtp: -1.5,
  lra: 7,
  /** QA tolerance around the integrated target. */
  toleranceLu: 0.5,
  /** QA ceiling for true peak after the final AAC encode. */
  maxTruePeakDbtp: -1.0,
} as const;

export type LoudnormMeasurement = {
  input_i: number;
  input_tp: number;
  input_lra: number;
  input_thresh: number;
  target_offset: number;
  normalization_type?: string;
};

/** Extract the JSON block loudnorm prints to stderr in pass 1. */
export const parseLoudnormJson = (stderr: string): LoudnormMeasurement => {
  const start = stderr.lastIndexOf("{");
  const end = stderr.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("loudnorm JSON block not found in ffmpeg output");
  const raw = JSON.parse(stderr.slice(start, end + 1)) as Record<string, string>;
  const num = (k: string) => {
    const v = Number(raw[k]);
    if (!Number.isFinite(v)) throw new Error(`loudnorm field ${k} missing or not numeric`);
    return v;
  };
  return {
    input_i: num("input_i"),
    input_tp: num("input_tp"),
    input_lra: num("input_lra"),
    input_thresh: num("input_thresh"),
    target_offset: num("target_offset"),
    normalization_type: raw.normalization_type,
  };
};

export type Ebur128Summary = { integratedLufs: number; truePeakDbtp: number; lra: number };

/** Parse the summary block of `-af ebur128=peak=true`. */
export const parseEbur128 = (stderr: string): Ebur128Summary => {
  const grab = (re: RegExp) => {
    const m = stderr.match(re);
    if (!m || m[1] === undefined) throw new Error(`ebur128 field not found: ${re}`);
    return Number(m[1]);
  };
  const integratedLufs = grab(/Integrated loudness:\s*\n?\s*I:\s*(-?[\d.]+) LUFS/);
  const lra = grab(/Loudness range:\s*\n?\s*LRA:\s*(-?[\d.]+) LU/);
  const truePeakDbtp = grab(/True peak:\s*\n?\s*Peak:\s*(-?[\d.]+) dBFS/);
  return { integratedLufs, truePeakDbtp, lra };
};

export type LoudnessVerdict = { ok: boolean; problems: string[] };

export const judgeLoudness = (m: Ebur128Summary, t = loudnessTarget): LoudnessVerdict => {
  const problems: string[] = [];
  if (Math.abs(m.integratedLufs - t.integratedLufs) > t.toleranceLu) {
    problems.push(`integrated ${m.integratedLufs} LUFS, target ${t.integratedLufs} ±${t.toleranceLu}`);
  }
  if (m.truePeakDbtp > t.maxTruePeakDbtp) {
    problems.push(`true peak ${m.truePeakDbtp} dBTP, ceiling ${t.maxTruePeakDbtp}`);
  }
  return { ok: problems.length === 0, problems };
};
