/**
 * The green-to-red safe-to-drive verdict, the one place `status.*` colours
 * are allowed. Maps the app's severity enum (low | moderate | high | critical)
 * to a position; the fill animates once because it explains something.
 */
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, type } from "@/brand/tokens";
import { easings } from "@/brand/motion";

export type Severity = "low" | "moderate" | "high" | "critical";

const position: Record<Severity, number> = { low: 0.12, moderate: 0.38, high: 0.65, critical: 0.9 };
const colour: Record<Severity, string> = {
  low: colors.status.green,
  moderate: colors.status.amber,
  high: colors.status.orange,
  critical: colors.status.red,
};
export const severityLabel: Record<Severity, string> = {
  low: "Safe to drive",
  moderate: "Drive with care",
  high: "Get it checked soon",
  critical: "Stop driving",
};

export const SeverityBar: React.FC<{ severity: Severity; x: number; y: number; width: number; enterFrame?: number }> = ({
  severity,
  x,
  y,
  width,
  enterFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [enterFrame, enterFrame + 0.7 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.move,
  });
  const markerX = width * position[severity] * t;
  return (
    <div style={{ position: "absolute", left: x, top: y, width }}>
      <div
        style={{
          height: 18,
          borderRadius: 9,
          background: `linear-gradient(90deg, ${colors.status.green}, ${colors.status.amber} 40%, ${colors.status.orange} 70%, ${colors.status.red})`,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -9,
          left: markerX - 18,
          width: 36,
          height: 36,
          borderRadius: 18,
          background: colour[severity],
          border: `4px solid ${colors.obsidian}`,
          boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
        }}
      />
      <div
        style={{
          marginTop: 28,
          color: colour[severity],
          fontFamily: fonts.sans,
          fontWeight: type.title.weight,
          fontSize: type.title.size,
          letterSpacing: `${type.title.letterSpacing}em`,
          opacity: t,
        }}
      >
        {severityLabel[severity]}
      </div>
    </div>
  );
};
