import { spawn } from "node:child_process";

export type RunResult = { code: number; stdout: string; stderr: string };

/** Run a command, capture both streams, never throw on a non-zero exit. */
export const run = (cmd: string, args: string[], opts: { cwd?: string } = {}): Promise<RunResult> =>
  new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });

export const runOrThrow = async (cmd: string, args: string[], opts: { cwd?: string } = {}): Promise<RunResult> => {
  const r = await run(cmd, args, opts);
  if (r.code !== 0) throw new Error(`${cmd} ${args.join(" ")} failed (${r.code}):\n${r.stderr.slice(-2000)}`);
  return r;
};
