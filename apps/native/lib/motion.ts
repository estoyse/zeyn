import { Easing, FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const DURATION = 600;
export const STAGGER = 80;

export function fadeUp(delay = 0) {
  return FadeInDown.duration(DURATION).easing(EASE).delay(delay);
}

export function fadeIn(delay = 0) {
  return FadeIn.duration(DURATION).easing(EASE).delay(delay);
}

export function scaleIn(delay = 0) {
  return ZoomIn.duration(DURATION).easing(EASE).delay(delay);
}

export function stagger(index: number, base = 0) {
  return base + index * STAGGER;
}
