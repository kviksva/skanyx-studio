/**
 * Tap indicators drawn from the capture timeline, in RECORDING pixel space;
 * the parent (PhoneFrame/Recording) scales the whole layer with the footage.
 * A single ring expands and fades over ~0.4 s. The debug crosshairs Flutter's
 * test binding draws are never captured (docs/research/05).
 */
import { useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "@/brand/tokens";
import { easings } from "@/brand/motion";
import { interpolate } from "remotion";
import type { Tap } from "@/lib/tap-timeline";

export const TapRings: React.FC<{ taps: Tap[]; clipStartFrame?: number; scale?: number }> = ({
  taps,
  clipStartFrame = 0,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = ((frame - clipStartFrame) / fps) * 1000;
  return (
    <>
      {taps.map((tap, i) => {
        const age = nowMs - tap.videoMs;
        if (age < 0 || age > 420) return null;
        const p = interpolate(age, [0, 420], [0, 1], { easing: easings.enter });
        const size = (56 + 70 * p) * scale;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: tap.x * scale - size / 2,
              top: tap.y * scale - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              border: `${3 * scale}px solid ${colors.amber}`,
              background: `rgba(212, 160, 84, ${0.28 * (1 - p)})`,
              opacity: 1 - p,
            }}
          />
        );
      })}
    </>
  );
};
