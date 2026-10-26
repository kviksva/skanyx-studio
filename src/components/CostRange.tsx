/**
 * "Roughly €X-Y" with the word "roughly" always present: the app's cost is a
 * profile-based forecast, never a price read off the car. Figures come from
 * the web repo (REPAIR_PRICES.md / dtc-codes) through scripts/facts.ts.
 */
import { useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, type } from "@/brand/tokens";
import { enterProgress } from "@/brand/motion";

const euro = (n: number) => `€${n.toLocaleString("en-IE")}`;

export const CostRange: React.FC<{ min: number; max: number; label?: string; x: number; y: number; enterFrame?: number }> = ({
  min,
  max,
  label = "Roughly",
  x,
  y,
  enterFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = enterProgress(frame, enterFrame, fps);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: t, transform: `translateY(${(1 - t) * 14}px)` }}>
      <div style={{ color: colors.inkMuted, fontFamily: fonts.sans, fontSize: type.small.size, fontWeight: type.small.weight }}>
        {label}
      </div>
      <div
        style={{
          color: colors.ink,
          fontFamily: fonts.sans,
          fontWeight: 600,
          fontSize: type.hook.size,
          letterSpacing: `${type.hook.letterSpacing}em`,
          lineHeight: 1.05,
        }}
      >
        {euro(min)}
        <span style={{ color: colors.inkFaint }}> to </span>
        {euro(max)}
      </div>
    </div>
  );
};
