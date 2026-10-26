/**
 * An app recording (normalised H.264 mezzanine from media/mezz) with its tap
 * rings, cropped to the screen area and scaled to `width`. Always wrap in
 * <PhoneFrame>. The clip's own audio is never used (recordings are silent;
 * UI sounds come from the SFX bank).
 *
 * Uses @remotion/media's <Video> with the OffthreadVideo fallback disabled:
 * if the mezzanine cannot be decoded the render fails loudly instead of
 * silently switching decoders (and colour handling) mid-video.
 */
import { Video } from "@remotion/media";
import { staticFile } from "remotion";
import { TapRings } from "./TapRings";
import type { Tap } from "@/lib/tap-timeline";

export const Recording: React.FC<{
  /** Path under public/media/mezz, e.g. "rec/scan-01.mp4". */
  src: string;
  /** Recording pixel size (from the tap timeline). */
  pixelSize: { width: number; height: number };
  /** Display width in canvas pixels. */
  width: number;
  taps?: Tap[];
  /** Seconds into the mezzanine to start. */
  trimBeforeS?: number;
  clipStartFrame?: number;
}> = ({ src, pixelSize, width, taps = [], trimBeforeS = 0, clipStartFrame = 0 }) => {
  const scale = width / pixelSize.width;
  const height = pixelSize.height * scale;
  return (
    <div style={{ position: "relative", width, height, overflow: "hidden" }}>
      <Video
        src={staticFile(`media/mezz/${src}`)}
        muted
        trimBefore={Math.round(trimBeforeS * 60)}
        disallowFallbackToOffthreadVideo
        objectFit="cover"
        style={{ width, height }}
      />
      <div style={{ position: "absolute", inset: 0 }}>
        <TapRings taps={taps} clipStartFrame={clipStartFrame} scale={scale} />
      </div>
    </div>
  );
};
