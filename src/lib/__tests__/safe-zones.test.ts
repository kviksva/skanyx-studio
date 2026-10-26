import { describe, expect, it } from "vitest";
import { isSafe, safeRect, safeZones, slots } from "../safe-zones";

describe("safe zones", () => {
  it("the union rectangle is x 120-880, y 288-1248", () => {
    expect(safeRect()).toEqual({ x: 120, y: 288, width: 760, height: 960 });
  });

  it("the union is inside every platform's own safe rectangle", () => {
    const u = safeRect(safeZones.union);
    for (const z of [safeZones.tiktok, safeZones.reels, safeZones.shorts]) {
      const r = safeRect(z);
      expect(u.x).toBeGreaterThanOrEqual(r.x);
      expect(u.y).toBeGreaterThanOrEqual(r.y);
      expect(u.x + u.width).toBeLessThanOrEqual(r.x + r.width);
      expect(u.y + u.height).toBeLessThanOrEqual(r.y + r.height);
    }
  });

  it("every named slot is safe on every platform", () => {
    for (const slot of Object.values(slots)) {
      expect(isSafe(slot, safeZones.union)).toBe(true);
    }
  });

  it("rejects an element under TikTok's button column", () => {
    expect(isSafe({ x: 800, y: 900, width: 200, height: 100 }, safeZones.tiktok)).toBe(false);
  });

  it("rejects an element in Meta's bottom 35%", () => {
    expect(isSafe({ x: 200, y: 1300, width: 200, height: 100 }, safeZones.reels)).toBe(false);
  });
});
