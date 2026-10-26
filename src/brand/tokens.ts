/**
 * Brand tokens. Colours mirror the web repo (tailwind.config + globals.css);
 * if the site changes a value, change it here in the same week, never invent
 * a third shade. `status.*` is for DATA (severity, verdicts) only: never use
 * it as decoration.
 */
export const colors = {
  /** Brand gold. Tailwind's amber-400/500 are brighter and read as drift. */
  amber: "#D4A054",
  amberBright: "#E8B866",
  amberGlow: "rgba(212, 160, 84, 0.15)",
  obsidian: "#08080A",
  carbon: "#0C0C0F",
  graphite: "#0F0F12",
  /** Text on dark surfaces. */
  ink: "#F5F5F4",
  inkMuted: "rgba(245, 245, 244, 0.68)",
  inkFaint: "rgba(245, 245, 244, 0.40)",
  line: "rgba(255, 255, 255, 0.08)",
  status: {
    green: "#4ADE80",
    amber: "#FBBF24",
    orange: "#FB923C",
    red: "#F87171",
  },
} as const;

export const fonts = {
  sans: "Geist",
  mono: "Geist Mono",
} as const;

/** Composition canvas. Every template renders at this size. */
export const canvas = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/**
 * Type scale in canvas pixels (1080 wide). Derived in docs/research/03:
 * hook 80-110, captions 56-72 (floor 52 on auto-shrink), body 44.
 */
export const type = {
  hook: { size: 96, weight: 600, lineHeight: 1.08, letterSpacing: -0.02 },
  title: { size: 64, weight: 600, lineHeight: 1.1, letterSpacing: -0.015 },
  caption: { size: 64, weight: 500, lineHeight: 1.2, letterSpacing: -0.01, floor: 52 },
  body: { size: 44, weight: 400, lineHeight: 1.3, letterSpacing: 0 },
  small: { size: 34, weight: 500, lineHeight: 1.3, letterSpacing: 0 },
  code: { size: 56, weight: 500, lineHeight: 1, letterSpacing: 0.02 },
} as const;

export const radius = {
  chip: 18,
  card: 28,
  phone: 72,
} as const;
