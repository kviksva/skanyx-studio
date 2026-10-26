/**
 * The safe-zone calibration video. Render it, upload PRIVATELY to TikTok,
 * Instagram Reels, Facebook Reels and YouTube Shorts, screenshot each on a
 * 9:16-ish phone and a tall (20:9) phone, and read off which grid cells the
 * platform UI covers. Then correct src/lib/safe-zones.ts and set
 * `calibrated = true`.
 *
 * The grid is labelled in both axes every 120 px; the current provisional
 * zones are drawn so the screenshot shows at once where they are wrong.
 */
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { CANVAS, safeRect, safeZones, gridCrop34 } from "@/lib/safe-zones";
import { colors, fonts } from "@/brand/tokens";

export const calibrationSchema = z.object({
  /** Which provisional zone to outline. */
  zone: z.enum(["tiktok", "reels", "shorts", "union"]),
});
export type CalibrationProps = z.infer<typeof calibrationSchema>;

const STEP = 120;

export const SafeZoneCalibration: React.FC<CalibrationProps> = ({ zone }) => {
  const z = safeZones[zone];
  const r = safeRect(z);
  const cols = CANVAS.width / STEP;
  const rows = CANVAS.height / STEP;
  return (
    <AbsoluteFill style={{ background: colors.graphite, fontFamily: fonts.sans }}>
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => (
          <div
            key={`${row}-${col}`}
            style={{
              position: "absolute",
              left: col * STEP,
              top: row * STEP,
              width: STEP,
              height: STEP,
              boxSizing: "border-box",
              border: "1px solid rgba(255,255,255,0.18)",
              background: (row + col) % 2 ? "rgba(255,255,255,0.04)" : "transparent",
              color: "rgba(255,255,255,0.55)",
              fontSize: 22,
              padding: 6,
            }}
          >
            {col === 0 ? `y${row * STEP}` : row === 0 ? `x${col * STEP}` : ""}
          </div>
        )),
      )}
      <div
        style={{
          position: "absolute",
          left: r.x,
          top: r.y,
          width: r.width,
          height: r.height,
          outline: `6px solid ${colors.status.green}`,
          boxSizing: "border-box",
        }}
      />
      {z.keepClear.map((k, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: k.x,
            top: k.y,
            width: k.width,
            height: k.height,
            background: "rgba(248,113,113,0.35)",
            outline: `4px dashed ${colors.status.red}`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: gridCrop34.x,
          top: gridCrop34.y,
          width: gridCrop34.width,
          height: gridCrop34.height,
          outline: "4px dashed rgba(120,180,255,0.9)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: r.x + 24,
          top: r.y + 24,
          color: colors.ink,
          fontSize: 44,
          fontWeight: 600,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        }}
      >
        {z.label}: provisional safe area
      </div>
      <div
        style={{
          position: "absolute",
          left: r.x + 24,
          top: r.y + r.height - 80,
          color: colors.amber,
          fontSize: 36,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        }}
      >
        Screenshot this on a phone and note what the UI covers.
      </div>
    </AbsoluteFill>
  );
};
