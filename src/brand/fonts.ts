/**
 * Geist (OFL) from public/fonts, loaded through @remotion/fonts so the render
 * waits for the font before capturing a frame. Measuring text before the font
 * is loaded is the classic "font flash / wrong width" bug; every component
 * that measures text (fitText) must await `ensureFonts()` first.
 */
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { fonts } from "./tokens";

const faces = [
  { family: fonts.sans, weight: "400", file: "Geist-Regular.woff2" },
  { family: fonts.sans, weight: "500", file: "Geist-Medium.woff2" },
  { family: fonts.sans, weight: "600", file: "Geist-SemiBold.woff2" },
  { family: fonts.sans, weight: "700", file: "Geist-Bold.woff2" },
  { family: fonts.mono, weight: "400", file: "GeistMono-Regular.woff2" },
  { family: fonts.mono, weight: "500", file: "GeistMono-Medium.woff2" },
] as const;

let loading: Promise<void> | null = null;

export const ensureFonts = (): Promise<void> => {
  if (!loading) {
    loading = Promise.all(
      faces.map((f) =>
        loadFont({
          family: f.family,
          url: staticFile(`fonts/${f.file}`),
          weight: f.weight,
          format: "woff2",
        }),
      ),
    ).then(() => undefined);
  }
  return loading;
};
