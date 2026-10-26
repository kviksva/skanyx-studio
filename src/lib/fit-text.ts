/**
 * Text fitting with a hard floor. `fitTextOnNLines` from @remotion/layout-utils
 * picks the largest font size that fits; we clamp it to the token's floor and
 * report when even the floor does not fit so the variant fails loudly instead
 * of shipping a clipped caption.
 */
import { fitTextOnNLines } from "@remotion/layout-utils";

export type FitResult = { fontSize: number; fits: boolean; lines: string[] };

export const fitText = (opts: {
  text: string;
  maxWidth: number;
  maxLines: number;
  maxFontSize: number;
  minFontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  letterSpacing?: string;
}): FitResult => {
  const r = fitTextOnNLines({
    text: opts.text,
    maxBoxWidth: opts.maxWidth,
    maxLines: opts.maxLines,
    fontFamily: opts.fontFamily,
    fontWeight: String(opts.fontWeight),
    maxFontSize: opts.maxFontSize,
    letterSpacing: opts.letterSpacing,
  });
  const fontSize = Math.max(opts.minFontSize, Math.min(opts.maxFontSize, r.fontSize));
  return { fontSize, fits: r.fontSize >= opts.minFontSize, lines: r.lines };
};
