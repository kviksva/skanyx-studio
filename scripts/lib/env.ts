/**
 * One place that reads .env and resolves the studio's paths. Every script
 * imports from here so a missing key fails with the same message everywhere.
 */
import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const env = {
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID ?? "",
  elevenlabsDictionaryId: process.env.ELEVENLABS_DICTIONARY_ID ?? "",
  elevenlabsDictionaryVersionId: process.env.ELEVENLABS_DICTIONARY_VERSION_ID ?? "",
  mediaRoot: process.env.MEDIA_ROOT ?? path.join(repoRoot, "media-local"),
  webRepo: process.env.WEB_REPO ?? path.resolve(repoRoot, "..", "CortexAutoWeb"),
  appRepo: process.env.APP_REPO ?? path.resolve(repoRoot, "..", "car_health_ai"),
};

export const require = (key: keyof typeof env, hint: string): string => {
  const v = env[key];
  if (!v) throw new Error(`${key} is not set in .env. ${hint}`);
  return v;
};

/** Subfolders under MEDIA_ROOT. Created by scripts/setup-media.ts. */
export const mediaDirs = {
  raw: "raw",
  mezz: "mezz",
  vo: "vo",
  sfx: "sfx",
  music: "music",
  renders: "renders",
  qa: "qa",
} as const;

export const mediaPath = (dir: keyof typeof mediaDirs, ...rest: string[]): string =>
  path.join(env.mediaRoot, mediaDirs[dir], ...rest);

export const assertMediaRoot = (): void => {
  if (!existsSync(env.mediaRoot)) {
    throw new Error(`MEDIA_ROOT ${env.mediaRoot} does not exist. Plug in the SSD or run \`npm run media:setup\`.`);
  }
};
