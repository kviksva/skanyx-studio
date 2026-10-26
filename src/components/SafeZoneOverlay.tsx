/**
 * Studio-only guide: draws one platform's unsafe bands, keep-clear areas and
 * the 3:4 grid crop over the composition. Never rendered in a final: the
 * template passes `overlay` from an input prop that defaults to "none", and
 * scripts/render.ts refuses to render with it set.
 */
import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import { CANVAS, gridCrop34, safeRect, safeZones, type SafeZone } from "@/lib/safe-zones";

export type OverlayChoice = SafeZone["id"] | "none";

const band = (style: CSSProperties) => (
  <div style={{ position: "absolute", background: "rgba(255, 60, 60, 0.28)", ...style }} />
);

export const SafeZoneOverlay: React.FC<{ choice: OverlayChoice }> = ({ choice }) => {
  if (choice === "none") return null;
  const zone = safeZones[choice];
  const r = safeRect(zone);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {band({ left: 0, top: 0, width: CANVAS.width, height: zone.top })}
      {band({ left: 0, top: CANVAS.height - zone.bottom, width: CANVAS.width, height: zone.bottom })}
      {band({ left: 0, top: zone.top, width: zone.left, height: r.height })}
      {band({ left: CANVAS.width - zone.right, top: zone.top, width: zone.right, height: r.height })}
      {zone.keepClear.map((k, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: k.x,
            top: k.y,
            width: k.width,
            height: k.height,
            background: "rgba(255, 60, 60, 0.4)",
            outline: "2px dashed rgba(255, 255, 255, 0.6)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: r.x,
          top: r.y,
          width: r.width,
          height: r.height,
          outline: "3px solid rgba(80, 255, 120, 0.9)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: gridCrop34.x,
          top: gridCrop34.y,
          width: gridCrop34.width,
          height: gridCrop34.height,
          outline: "2px dashed rgba(120, 180, 255, 0.9)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: r.x + 12,
          top: r.y + 12,
          fontFamily: "Geist, sans-serif",
          fontSize: 30,
          color: "rgba(80,255,120,0.95)",
        }}
      >
        {zone.label} safe area (green), 3:4 grid crop (blue)
      </div>
    </AbsoluteFill>
  );
};
