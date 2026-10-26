/**
 * Platform UI safe zones on a 1080x1920 canvas.
 *
 * Numbers come from docs/research/03-shortform-craft.md section 2. TikTok and
 * Shorts values are read from the platforms' ad templates by a third party;
 * Meta's are the published percentages. They are PROVISIONAL until the
 * calibration upload (src/calibration) has been screenshotted on real phones;
 * update `calibrated` and the numbers together when that happens.
 */
export type Rect = { x: number; y: number; width: number; height: number };

export type SafeZone = {
  id: "tiktok" | "reels" | "shorts" | "union";
  label: string;
  /** Insets in canvas pixels. */
  top: number;
  bottom: number;
  left: number;
  right: number;
  /** Extra rectangles that must stay clear (e.g. TikTok's button column). */
  keepClear: Rect[];
};

export const CANVAS = { width: 1080, height: 1920 } as const;

export const calibrated = false;

export const safeZones: Record<SafeZone["id"], SafeZone> = {
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    top: 240,
    bottom: 660,
    left: 120,
    right: 120,
    keepClear: [{ x: 880, y: 840, width: 200, height: 660 }],
  },
  reels: {
    id: "reels",
    label: "Instagram / Facebook Reels",
    // Meta: 14% top, 35% bottom, 6% each side.
    top: Math.round(0.14 * 1920),
    bottom: Math.round(0.35 * 1920),
    left: Math.round(0.06 * 1080),
    right: Math.round(0.06 * 1080),
    keepClear: [],
  },
  shorts: {
    id: "shorts",
    label: "YouTube Shorts",
    top: 288,
    bottom: 672,
    left: 48,
    right: 192,
    keepClear: [],
  },
  union: {
    id: "union",
    label: "All platforms",
    top: 288,
    bottom: 672,
    left: 120,
    // 200, not Shorts' 192: TikTok's button column starts at x 880.
    right: 200,
    keepClear: [{ x: 880, y: 840, width: 200, height: 660 }],
  },
};

/** The rectangle that is safe on every platform: x 120-880, y 288-1248. */
export const safeRect = (zone: SafeZone = safeZones.union): Rect => ({
  x: zone.left,
  y: zone.top,
  width: CANVAS.width - zone.left - zone.right,
  height: CANVAS.height - zone.top - zone.bottom,
});

/** Instagram's 3:4 grid crop, centred: y 240-1680. */
export const gridCrop34: Rect = {
  x: 0,
  y: Math.round((1920 - 1080 * (4 / 3)) / 2),
  width: 1080,
  height: Math.round(1080 * (4 / 3)),
};

const intersects = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

const contains = (outer: Rect, inner: Rect): boolean =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

/**
 * Is `element` fully inside the safe rectangle and outside every keep-clear
 * area of `zone`? Used by the QA lint and by components in dev to assert
 * their own placement.
 */
export const isSafe = (element: Rect, zone: SafeZone = safeZones.union): boolean =>
  contains(safeRect(zone), element) && !zone.keepClear.some((k) => intersects(element, k));

/** Named slots inside the union rectangle (docs/research/03 section A). */
export const slots = {
  /** Hook text: top of the safe area. */
  hook: { x: 120, y: 300, width: 760, height: 260 },
  /** Captions: lower third of the safe area. */
  caption: { x: 120, y: 1000, width: 760, height: 240 },
  /** End card content. */
  endCard: { x: 120, y: 560, width: 760, height: 600 },
} as const satisfies Record<string, Rect>;
