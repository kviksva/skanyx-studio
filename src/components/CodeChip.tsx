/** A fault code in Geist Mono on a dark chip. Data, not decoration. */
import { useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, radius, type } from "@/brand/tokens";
import { settle } from "@/brand/motion";

export const CodeChip: React.FC<{ code: string; enterFrame?: number; x: number; y: number }> = ({
  code,
  enterFrame = 0,
  x,
  y,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = settle(frame, fps, enterFrame, "light");
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: "16px 28px",
        borderRadius: radius.chip,
        background: colors.carbon,
        border: `2px solid ${colors.line}`,
        color: colors.amber,
        fontFamily: fonts.mono,
        fontWeight: type.code.weight,
        fontSize: type.code.size,
        letterSpacing: `${type.code.letterSpacing}em`,
        opacity: t,
        transform: `scale(${0.96 + 0.04 * t})`,
        transformOrigin: "left center",
      }}
    >
      {code}
    </div>
  );
};
