/**
 * Phrase captions on a solid plate in the caption slot. One or two lines,
 * sentence case, one typeface, at most one emphasised word (wrap it in
 * `*asterisks*` in the page text). No per-word bouncing, no emoji.
 */
import { useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, type } from "@/brand/tokens";
import { enterProgress } from "@/brand/motion";
import type { CaptionPage } from "@/lib/captions-from-alignment";
import { slots } from "@/lib/safe-zones";

const renderLine = (line: string) => {
  const parts = line.split(/(\*[^*]+\*)/g).filter(Boolean);
  return parts.map((p, i) =>
    p.startsWith("*") && p.endsWith("*") ? (
      <span key={i} style={{ color: colors.amber }}>
        {p.slice(1, -1)}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
};

export const Captions: React.FC<{
  pages: CaptionPage[];
  /** Composition frame at which the pages' 0 ms sits. */
  startFrame?: number;
  fontSize?: number;
}> = ({ pages, startFrame = 0, fontSize = type.caption.size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = ((frame - startFrame) / fps) * 1000;
  const page = pages.find((p) => ms >= p.startMs && ms < p.endMs);
  if (!page) return null;
  const pageStart = startFrame + Math.round((page.startMs / 1000) * fps);
  const t = enterProgress(frame, pageStart, fps);
  const slot = slots.caption;
  return (
    <div
      style={{
        position: "absolute",
        left: slot.x,
        top: slot.y,
        width: slot.width,
        height: slot.height,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "14px 28px",
          borderRadius: 18,
          background: "rgba(8, 8, 10, 0.82)",
          color: colors.ink,
          fontFamily: fonts.sans,
          fontWeight: type.caption.weight,
          fontSize,
          lineHeight: type.caption.lineHeight,
          letterSpacing: `${type.caption.letterSpacing}em`,
          textAlign: "center",
          opacity: t,
          transform: `translateY(${(1 - t) * 10}px)`,
        }}
      >
        {page.lines.map((l, i) => (
          <div key={i}>{renderLine(l)}</div>
        ))}
      </div>
    </div>
  );
};
