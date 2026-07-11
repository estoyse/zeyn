import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  ZoomIn,
  type WithSpringConfig,
  type WithTimingConfig,
} from "react-native-reanimated";

const RM = ReduceMotion.System;

export const SPRING = {
  press: { duration: 220, dampingRatio: 0.85, reduceMotion: RM },
  snappy: { duration: 340, dampingRatio: 0.92, reduceMotion: RM },
  gentle: { duration: 480, dampingRatio: 1, reduceMotion: RM },
  overlay: { duration: 420, dampingRatio: 0.88, reduceMotion: RM },
  bouncy: { duration: 550, dampingRatio: 0.62, reduceMotion: RM },
} satisfies Record<string, WithSpringConfig>;

export const DUR = {
  instant: 90,
  fast: 160,
  base: 240,
  slow: 340,
  slower: 500,
} as const;

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_STANDARD = Easing.bezier(0.2, 0, 0, 1);
export const EASE_OUT = Easing.out(Easing.cubic);

export const TIMING = {
  fast: { duration: DUR.fast, easing: EASE, reduceMotion: RM },
  base: { duration: DUR.base, easing: EASE, reduceMotion: RM },
  slow: { duration: DUR.slow, easing: EASE, reduceMotion: RM },
} satisfies Record<string, WithTimingConfig>;

export const PRESS = {
  scale: 0.96,
  scaleWide: 0.975,
  scaleIcon: 0.9,
  opacity: 0.9,
  hitSlop: 8,
} as const;

export const DURATION = DUR.slow;
export const STAGGER = 45;

const STAGGER_CAP = 6;

export function stagger(index: number, base = 0) {
  return base + Math.min(index, STAGGER_CAP) * STAGGER;
}

export function fadeUp(delay = 0) {
  return FadeInDown.duration(DUR.slow).easing(EASE).delay(delay).reduceMotion(RM);
}

export function fadeIn(delay = 0) {
  return FadeIn.duration(DUR.base).easing(EASE).delay(delay).reduceMotion(RM);
}

export function fadeOut(delay = 0) {
  return FadeOut.duration(DUR.fast).easing(EASE).delay(delay).reduceMotion(RM);
}

export function scaleIn(delay = 0) {
  return ZoomIn.duration(DUR.slow).easing(EASE).delay(delay).reduceMotion(RM);
}

export function listItem(index: number, base = 0) {
  return fadeUp(stagger(index, base));
}

export const LAYOUT = LinearTransition.springify()
  .damping(20)
  .stiffness(180)
  .reduceMotion(RM);
