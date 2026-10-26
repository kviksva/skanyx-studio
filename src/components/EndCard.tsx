/**
 * The closing 2-3 s: wordmark, the exact store claim, both badges per the
 * Apple and Google rules (docs/disclosure.md section "Store badges"):
 * one static black App Store badge FIRST, the Google Play badge at the same
 * height, neither animated, credit lines in small type. Optional burned-in
 * AI-voice mark (default follows the lawyer's answer; see CLAUDE.md).
 *
 * Badge artwork: public/badges/app-store-black.svg (Apple Marketing Tools)
 * and public/badges/google-play.png (Google's badge generator). Until the
 * files exist, text placeholders render and QA warns.
 */
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, type } from "@/brand/tokens";
import { enterProgress } from "@/brand/motion";
import { slots } from "@/lib/safe-zones";

export const STORE_CLAIM = "Free on iOS and Android";
export const ADAPTER_NOTE = "Works with a Bluetooth ELM327 OBD2 adapter";

export const EndCard: React.FC<{ enterFrame?: number; aiVoiceMark?: boolean; badgesAvailable?: boolean }> = ({
  enterFrame = 0,
  aiVoiceMark = false,
  badgesAvailable = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = enterProgress(frame, enterFrame, fps);
  const slot = slots.endCard;
  const badgeHeight = 108;
  return (
    <div
      style={{
        position: "absolute",
        left: slot.x,
        top: slot.y,
        width: slot.width,
        height: slot.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
        opacity: t,
        fontFamily: fonts.sans,
        color: colors.ink,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: "0.08em" }}>SKANYX</div>
      <div style={{ fontSize: type.title.size, fontWeight: 500 }}>{STORE_CLAIM}</div>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }} data-badges={badgesAvailable ? "real" : "placeholder"}>
        {badgesAvailable ? (
          <>
            <Img src={staticFile("badges/app-store-black.svg")} style={{ height: badgeHeight }} />
            <Img src={staticFile("badges/google-play.png")} style={{ height: badgeHeight }} />
          </>
        ) : (
          <>
            <Placeholder label="App Store" />
            <Placeholder label="Google Play" />
          </>
        )}
      </div>
      <div style={{ fontSize: type.small.size, color: colors.inkMuted, maxWidth: 640 }}>{ADAPTER_NOTE}</div>
      {aiVoiceMark ? (
        <div style={{ fontSize: 28, color: colors.inkFaint, marginTop: 8 }}>Voice generated with AI</div>
      ) : null}
      <div style={{ fontSize: 22, color: colors.inkFaint, lineHeight: 1.4, maxWidth: 700 }}>
        Apple, the Apple logo and App Store are trademarks of Apple Inc. Google Play and the Google Play logo are
        trademarks of Google LLC.
      </div>
    </div>
  );
};

const Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      height: 108,
      padding: "0 36px",
      display: "flex",
      alignItems: "center",
      borderRadius: 16,
      border: `2px dashed ${colors.inkFaint}`,
      color: colors.inkMuted,
      fontSize: 30,
    }}
  >
    {label} badge
  </div>
);
