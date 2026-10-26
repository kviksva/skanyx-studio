/**
 * The one definition of "final quality" for a render. scripts/render.ts passes
 * these to renderMedia(); the CLI equivalent is documented in docs/style-guide.md
 * so a manual `npx remotion render` can match it.
 */
export const finalRender = {
  codec: "h264",
  crf: 16,
  x264Preset: "slow",
  pixelFormat: "yuv420p",
  colorSpace: "bt709",
  imageFormat: "png",
  audioCodec: "aac",
  audioBitrate: "320k",
  /** Hz. Social platforms expect 48 kHz AAC. */
  sampleRate: 48000,
  /** Hardware encoders ignore CRF; keep them for drafts only. */
  hardwareAcceleration: "disable",
} as const;

export const draftRender = {
  codec: "h264",
  hardwareAcceleration: "if-possible",
  videoBitrate: "12M",
  pixelFormat: "yuv420p",
  colorSpace: "bt709",
  imageFormat: "jpeg",
  jpegQuality: 90,
  audioCodec: "aac",
  audioBitrate: "192k",
  sampleRate: 48000,
} as const;
