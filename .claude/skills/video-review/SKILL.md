---
name: video-review
description: Review a rendered Skanyx short - run npm run qa, read the contact sheet, walk docs/checklist.md item by item, and write projects/<slug>/review.md with pass/fail per item and the exact fix for each failure. Never approves on its own; the owner approves the final.
when_to_use: Use when a final render exists (media/renders/<comp>/<slug>.final.mp4), or when the owner asks "is this ready to post".
---

## Steps

1. `npm run qa -- <final.mp4> --project projects/<slug>`. Paste the FAIL and WARN lines into `review.md`. A spec, loudness or sign-off failure is a hard stop.
2. Open the contact sheet (`<final>.sheet.png`) with the Read tool and look at every tile: frame 0 is the problem with no logo; the app by about 8 s; nothing readable in the TikTok rail; the end card inside the safe rectangle; no held frame across 3+ tiles.
3. Walk `docs/checklist.md` 1-20. For each: PASS, FAIL with the exact fix (which file, which value), or NEEDS HUMAN (muted/eyes-off tests, device check, read-aloud, blind listening) with who does it.
4. Re-check claims against the Claims table in `review.md` and the files it cites (`npm run facts`). A number that moved since the script was signed resets the sign-off.
5. Confirm the render was made with `overlay: "none"` and the CSS-fallback phone frame / placeholder badges warnings are absent.
6. Write `review.md`: QA output, checklist table, open items, and the two sign-off lines left for humans:

```
Claims signed off by:
Final render approved by:
```

Report the count of FAIL / NEEDS HUMAN in the first line of your reply.
