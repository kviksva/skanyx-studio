/**
 * Read-only access to the facts a video may state, straight from the web
 * repo. The studio keeps NO copies: a code's severity, its cost rows, the
 * capability ground truth and the price file are read at script time, so a
 * video cannot drift from the site.
 *
 *   npm run facts -- code P0420        # severity, safe-to-drive note, cost rows, summary
 *   npm run facts -- prices "fuel pump"  # grep REPAIR_PRICES.md rows
 *   npm run facts -- capability "live data"  # grep CAPABILITY_GROUND_TRUTH.md
 *   npm run facts -- positioning       # print SKANYX_POSITIONING.md sections 1-3
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { env } from "./lib/env";

const web = env.webRepo;
const p = (...parts: string[]) => path.join(web, ...parts);

export type DtcCode = {
  code: string;
  title: string;
  category: string;
  severity: "low" | "moderate" | "high" | "critical";
  safe_to_drive: boolean;
  safe_to_drive_note: string;
  summary: string;
  symptoms: string[];
  common_causes: unknown[];
  repair_costs: unknown;
  last_updated: string;
};

export const readCode = (code: string): DtcCode => {
  const file = p("data", "dtc-codes", `${code.toUpperCase()}.json`);
  if (!existsSync(file)) throw new Error(`No code page for ${code} (${file}). Only codes with a page may be the subject of a video.`);
  return JSON.parse(readFileSync(file, "utf8")) as DtcCode;
};

export const grepFile = (file: string, needle: string): string[] =>
  readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.toLowerCase().includes(needle.toLowerCase()));

export const files = {
  prices: p("content", "blog", "_SYSTEM", "REPAIR_PRICES.md"),
  capability: p("content", "blog", "_SYSTEM", "CAPABILITY_GROUND_TRUTH.md"),
  positioning: p("content", "blog", "_SYSTEM", "SKANYX_POSITIONING.md"),
  competitorPrices: p("content", "blog", "_SYSTEM", "COMPETITOR_PRICES.md"),
  dtcStats: p("data", "dtc-stats.json"),
};

const main = () => {
  const [cmd, ...rest] = process.argv.slice(2);
  const arg = rest.join(" ");
  if (!existsSync(web)) {
    console.error(`WEB_REPO ${web} not found; set it in .env`);
    process.exit(1);
  }
  switch (cmd) {
    case "code": {
      const c = readCode(arg);
      console.log(JSON.stringify({
        code: c.code,
        title: c.title,
        severity: c.severity,
        safe_to_drive: c.safe_to_drive,
        safe_to_drive_note: c.safe_to_drive_note,
        summary: c.summary,
        symptoms: c.symptoms,
        repair_costs: c.repair_costs,
        last_updated: c.last_updated,
      }, null, 2));
      return;
    }
    case "prices":
      console.log(grepFile(files.prices, arg).join("\n") || "(no row matches)");
      return;
    case "capability":
      console.log(grepFile(files.capability, arg).join("\n") || "(no line matches)");
      return;
    case "positioning": {
      const text = readFileSync(files.positioning, "utf8");
      console.log(text.split("## 4.")[0]);
      return;
    }
    default:
      console.log("usage: npm run facts -- code <CODE> | prices <text> | capability <text> | positioning");
  }
};

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main();
