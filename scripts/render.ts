/**
 * Batch renderer: bundle once, render one or many variants with the FINAL
 * settings from src/brand/render-settings.ts. Refuses to render a final with
 * a safe-zone overlay switched on.
 *
 *   npm run render -- <compositionId> [--props projects/<slug>/props.json] [--draft] [--out <file>]
 */
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { draftRender, finalRender } from "@/brand/render-settings";
import { makeBundlerOverride } from "@/bundler-override";
import { assertMediaRoot, mediaPath, repoRoot } from "./lib/env";

const main = async () => {
  const args = process.argv.slice(2);
  const compositionId = args.find((a) => !a.startsWith("--"));
  if (!compositionId) throw new Error("usage: npm run render -- <compositionId> [--props file.json] [--draft] [--out file.mp4]");
  const get = (f: string) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);
  const draft = args.includes("--draft");
  const propsFile = get("--props");
  const inputProps: Record<string, unknown> = propsFile ? (JSON.parse(readFileSync(propsFile, "utf8")) as Record<string, unknown>) : {};
  if (!draft && inputProps.overlay && inputProps.overlay !== "none") {
    throw new Error(`Refusing a final render with overlay=${String(inputProps.overlay)}. Set it to "none".`);
  }
  assertMediaRoot();
  const outDir = mediaPath("renders", draft ? "_drafts" : compositionId);
  mkdirSync(outDir, { recursive: true });
  const stem = propsFile ? path.basename(propsFile).replace(/\.json$/, "") : compositionId;
  const outputLocation = get("--out") ?? path.join(outDir, `${stem}${draft ? ".draft" : ""}.mp4`);

  console.log("bundling...");
  const serveUrl = await bundle({
    entryPoint: path.join(repoRoot, "src", "index.ts"),
    publicDir: path.join(repoRoot, "public"),
    rspack: true,
    bundlerOverride: makeBundlerOverride(path.join(repoRoot, "src")),
    onProgress: () => undefined,
  });
  const composition = await selectComposition({ serveUrl, id: compositionId, inputProps });
  console.log(`rendering ${compositionId} (${composition.width}x${composition.height} @ ${composition.fps}, ${composition.durationInFrames} frames) ${draft ? "DRAFT" : "FINAL"}`);
  const t0 = Date.now();
  const settings = draft ? draftRender : finalRender;
  await renderMedia({
    composition,
    serveUrl,
    inputProps,
    outputLocation,
    codec: settings.codec,
    pixelFormat: settings.pixelFormat,
    colorSpace: settings.colorSpace,
    imageFormat: settings.imageFormat,
    audioCodec: settings.audioCodec,
    audioBitrate: settings.audioBitrate,
    hardwareAcceleration: settings.hardwareAcceleration,
    ...(draft
      ? { videoBitrate: draftRender.videoBitrate, jpegQuality: draftRender.jpegQuality }
      : { crf: finalRender.crf, x264Preset: finalRender.x264Preset }),
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      if (pct % 10 === 0) process.stdout.write(`\r${pct}%`);
    },
  });
  console.log(`\n-> ${outputLocation} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (!existsSync(outputLocation)) throw new Error("render reported success but no file was written");
};

main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
