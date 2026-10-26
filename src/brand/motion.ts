/**
 * Named motion tokens. Every animation in the studio uses one of these, never
 * a bare `spring()` with defaults (its bounce is the single most recognisable
 * "made with a template" tell) and never a transition picked for effect.
 *
 * Rules (docs/style-guide.md, "Motion"):
 *  - hard cuts on voice beats are the default; a transition needs a reason;
 *  - animate only what explains (severity bar filling, a cost range revealing);
 *  - delays are chosen per beat, not evenly staggered;
 *  - scale animations use `output: "perceptual-scale"`.
 */
import { Easing, interpolate, spring, type SpringConfig } from "remotion";

export const durations = {
  /** Element entering the frame. */
  enter: 0.35,
  /** Element leaving. Exits are faster than entries. */
  exit: 0.2,
  /** A value or position moving while on screen. */
  move: 0.45,
  /** Emphasis pulse on a key number. */
  emphasis: 0.5,
} as const;

export const easings = {
  /** Fast start, soft landing. For entries. */
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  /** Accelerating out of frame. For exits. */
  exit: Easing.bezier(0.7, 0, 0.84, 0),
  /** Symmetric, for on-screen moves. */
  move: Easing.bezier(0.65, 0, 0.35, 1),
} as const;

/** Springs without overshoot (damping 200 = no bounce) unless named otherwise. */
export const springs: Record<"settle" | "heavy" | "light", Partial<SpringConfig>> = {
  /** Default: lands without bounce. */
  settle: { damping: 200 },
  /** A heavy object (the phone frame): slower, no bounce. */
  heavy: { damping: 200, mass: 1.6, stiffness: 80 },
  /** A small chip; slight life, still no visible overshoot. */
  light: { damping: 26, mass: 0.6, stiffness: 170 },
};

/**
 * Progress 0..1 for an entry that starts at `startFrame`.
 * Clamped, eased, no overshoot.
 */
export const enterProgress = (frame: number, startFrame: number, fps: number): number =>
  interpolate(frame, [startFrame, startFrame + durations.enter * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.enter,
  });

/** Progress 0..1 for an exit that starts at `startFrame`. */
export const exitProgress = (frame: number, startFrame: number, fps: number): number =>
  interpolate(frame, [startFrame, startFrame + durations.exit * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.exit,
  });

/** A spring-driven 0..1 with one of the named configs. */
export const settle = (
  frame: number,
  fps: number,
  startFrame: number,
  config: keyof typeof springs = "settle",
): number => spring({ frame: frame - startFrame, fps, config: springs[config] });
