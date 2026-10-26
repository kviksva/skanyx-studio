/**
 * The phone the app recording plays in. Apple's rules (docs/disclosure.md):
 * use Apple's own bezel artwork, straight-on, never tilted, spun or animated;
 * move the camera (pan/zoom the whole frame), not the device.
 *
 * Bezel artwork: drop Apple's "iPhone 16 Pro Max" PNG from Apple Design
 * Resources into public/devices/iphone-16-pro-max.png and set `bezel`.
 * Until then a neutral rounded frame is drawn in CSS and flagged in QA
 * (`qa.ts` warns when a final render used the CSS fallback).
 */
import type { PropsWithChildren } from "react";
import { Img, staticFile } from "remotion";
import { colors, radius } from "@/brand/tokens";

export type PhoneFrameProps = {
  /** Width of the SCREEN area in canvas pixels; the frame adds the bezel. */
  screenWidth: number;
  screenAspect?: number;
  /** Bezel file in public/devices and the screen inset it needs (fractions). */
  bezel?: { file: string; inset: { top: number; right: number; bottom: number; left: number } };
  x: number;
  y: number;
};

export const PhoneFrame: React.FC<PropsWithChildren<PhoneFrameProps>> = ({
  screenWidth,
  screenAspect = 2868 / 1320,
  bezel,
  x,
  y,
  children,
}) => {
  const screenHeight = screenWidth * screenAspect;
  if (bezel) {
    const frameWidth = screenWidth / (1 - bezel.inset.left - bezel.inset.right);
    const frameHeight = screenHeight / (1 - bezel.inset.top - bezel.inset.bottom);
    return (
      <div style={{ position: "absolute", left: x, top: y, width: frameWidth, height: frameHeight }}>
        <div
          style={{
            position: "absolute",
            left: frameWidth * bezel.inset.left,
            top: frameHeight * bezel.inset.top,
            width: screenWidth,
            height: screenHeight,
            overflow: "hidden",
            borderRadius: radius.phone * (screenWidth / 440),
            background: colors.obsidian,
          }}
        >
          {children}
        </div>
        <Img
          src={staticFile(`devices/${bezel.file}`)}
          style={{ position: "absolute", inset: 0, width: frameWidth, height: frameHeight, pointerEvents: "none" }}
        />
      </div>
    );
  }
  const pad = screenWidth * 0.035;
  return (
    <div
      data-phone-frame="css-fallback"
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: screenWidth + pad * 2,
        height: screenHeight + pad * 2,
        borderRadius: radius.phone * (screenWidth / 440) + pad,
        background: "#1a1a1e",
        boxShadow: "0 40px 80px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: pad,
          top: pad,
          width: screenWidth,
          height: screenHeight,
          overflow: "hidden",
          borderRadius: radius.phone * (screenWidth / 440),
          background: colors.obsidian,
        }}
      >
        {children}
      </div>
    </div>
  );
};
