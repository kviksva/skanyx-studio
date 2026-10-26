/**
 * Studio + CLI configuration only. The batch renderer (scripts/render.ts)
 * uses the Node APIs and passes every option explicitly; keep the two in sync
 * through src/brand/render-settings.ts, never by editing one of them alone.
 */
import { Config } from "@remotion/cli/config";
import path from "node:path";
import { makeBundlerOverride } from "./src/bundler-override";

Config.setRspack(true);
Config.overrideBundlerConfig(makeBundlerOverride(path.resolve(process.cwd(), "src")));
// PNG frames: lossless capture before x264. JPEG capture adds a second lossy
// stage on top of the final encode and softens text edges on captions.
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
Config.setEntryPoint("./src/index.ts");
