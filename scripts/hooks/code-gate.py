#!/usr/bin/env python3
"""
skanyx-studio PostToolUse hook: lint + typecheck the single TS/TSX file just
edited. Exit 2 (stderr fed back to the agent) on any finding; exit 0 otherwise.
Mirrors the web repo's code-gate contract. Keep it fast: no renders here.
"""
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR") or Path(__file__).resolve().parents[2])
EXTS = {".ts", ".tsx", ".mts", ".mjs", ".js"}


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0
    path = (payload.get("tool_input") or {}).get("file_path") or ""
    if not path:
        return 0
    p = Path(path)
    try:
        rel = p.resolve().relative_to(ROOT)
    except ValueError:
        return 0
    if p.suffix not in EXTS:
        return 0
    if rel.parts[0] not in {"src", "scripts"} and rel.name != "remotion.config.ts":
        return 0
    if rel.parts[:2] == ("scripts", "hooks"):
        return 0
    npx = shutil.which("npx")
    if not npx:
        print("code-gate: npx not found; skipped", file=sys.stderr)
        return 0
    errors = []
    r = subprocess.run([npx, "eslint", "--max-warnings", "0", "--no-warn-ignored", str(rel)], cwd=ROOT,
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        errors.append(r.stdout.strip() or r.stderr.strip())
    r = subprocess.run([npx, "tsc", "--noEmit", "-p", "tsconfig.json"], cwd=ROOT,
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        lines = [l for l in r.stdout.splitlines() if str(rel) in l] or r.stdout.splitlines()[:20]
        errors.append("\n".join(lines))
    if errors:
        sys.stderr.write(f"code-gate: {rel} has findings. Fix them before continuing.\n\n" + "\n\n".join(errors) + "\n")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
