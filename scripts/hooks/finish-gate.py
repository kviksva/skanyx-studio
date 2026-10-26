#!/usr/bin/env python3
"""
skanyx-studio Stop hook: when the turn changed code, run `npm run check`
(lint + typecheck + unit tests) and block the turn from ending until green.
Blocks at most 3 times per turn, then stands down LOUDLY (a stand-down is not
a pass). Renders are never run here.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR") or Path(__file__).resolve().parents[2])
STATE = ROOT / "node_modules" / ".cache" / "skanyx-gates" / "finish-gate.json"
MAX_BLOCKS = 3


def changed_code() -> bool:
    r = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, capture_output=True, text=True)
    for line in r.stdout.splitlines():
        f = line[3:].strip()
        if f.startswith(("src/", "scripts/")) or f in {"remotion.config.ts", "package.json", "tsconfig.json"}:
            return True
    return False


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}
    if not changed_code():
        return 0
    STATE.parent.mkdir(parents=True, exist_ok=True)
    state = {}
    if STATE.exists():
        try:
            state = json.loads(STATE.read_text())
        except Exception:
            state = {}
    session = payload.get("session_id", "")
    blocks = state.get("blocks", 0) if state.get("session") == session else 0
    r = subprocess.run(["npm", "run", "check", "--silent"], cwd=ROOT, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    if r.returncode == 0:
        STATE.write_text(json.dumps({"session": session, "blocks": 0}))
        return 0
    blocks += 1
    STATE.write_text(json.dumps({"session": session, "blocks": blocks}))
    tail = (r.stdout + "\n" + r.stderr)[-6000:]
    if blocks > MAX_BLOCKS:
        print(json.dumps({"decision": None, "reason": f"finish-gate STOOD DOWN after {MAX_BLOCKS} blocks while STILL RED. Run `npm run check` by hand.\n{tail}"}))
        return 0
    print(json.dumps({"decision": "block", "reason": f"finish-gate ({blocks}/{MAX_BLOCKS}): `npm run check` is red. Fix and finish again.\n{tail}"}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
