/**
 * Create the MEDIA_ROOT tree and point ./public/media at it, so Remotion's
 * staticFile("media/...") resolves to the SSD. Idempotent.
 *
 *   npm run media:setup
 */
import { existsSync, lstatSync, mkdirSync, readlinkSync, symlinkSync, unlinkSync } from "node:fs";
import path from "node:path";
import { env, mediaDirs, repoRoot } from "./lib/env";

const root = env.mediaRoot;
if (!existsSync(path.dirname(root))) {
  console.error(`The parent of MEDIA_ROOT (${path.dirname(root)}) is not mounted. Plug in the SSD or edit .env.`);
  process.exit(1);
}
for (const d of Object.values(mediaDirs)) mkdirSync(path.join(root, d), { recursive: true });

const link = path.join(repoRoot, "public", "media");
if (existsSync(link) || (() => { try { lstatSync(link); return true; } catch { return false; } })()) {
  const current = lstatSync(link).isSymbolicLink() ? readlinkSync(link) : null;
  if (current === root) {
    console.log(`public/media already -> ${root}`);
    process.exit(0);
  }
  if (current === null) {
    console.error("public/media exists and is not a symlink; move it aside first.");
    process.exit(1);
  }
  unlinkSync(link);
}
symlinkSync(root, link);
console.log(`public/media -> ${root}`);
console.log(`Folders: ${Object.values(mediaDirs).join(", ")}`);
