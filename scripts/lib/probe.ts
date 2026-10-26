/** ffprobe wrapper returning the ProbeSummary the spec gate judges. */
import type { ProbeSummary } from "@/lib/spec-gate";
import { runOrThrow } from "./shell";

type Stream = {
  codec_type: string;
  codec_name: string;
  profile?: string;
  width?: number;
  height?: number;
  pix_fmt?: string;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  color_primaries?: string;
  color_transfer?: string;
  color_space?: string;
  sample_rate?: string;
  channels?: number;
};

const rate = (s: string | undefined): number => {
  if (!s) return 0;
  const [n, d] = s.split("/").map(Number);
  return d ? (n ?? 0) / d : (n ?? 0);
};

export const probe = async (file: string): Promise<ProbeSummary> => {
  const r = await runOrThrow("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file]);
  const data = JSON.parse(r.stdout) as { streams: Stream[]; format: { duration: string } };
  const v = data.streams.find((s) => s.codec_type === "video");
  const a = data.streams.find((s) => s.codec_type === "audio");
  if (!v) throw new Error(`${file}: no video stream`);
  const avg = rate(v.avg_frame_rate);
  const rf = rate(v.r_frame_rate);
  return {
    width: v.width ?? 0,
    height: v.height ?? 0,
    fps: Math.round(avg * 1000) / 1000,
    constantFrameRate: Math.abs(avg - rf) < 0.001,
    videoCodec: v.codec_name,
    profile: v.profile ?? "",
    pixFmt: v.pix_fmt ?? "",
    colorPrimaries: v.color_primaries,
    colorTransfer: v.color_transfer,
    colorSpace: v.color_space,
    audioCodec: a?.codec_name,
    audioSampleRate: a ? Number(a.sample_rate) : undefined,
    audioChannels: a?.channels,
    durationS: Number(data.format.duration),
  };
};
