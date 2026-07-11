import * as Haptics from "expo-haptics";
import { runOnJS } from "react-native-reanimated";

/*
  INTERACTION → HAPTIC POLICY

  tab switch ......................... select   (suppressed if already focused)
  button press ....................... tap      (fired by Button, not the screen)
  card / list row press .............. tap      (fired by PressableScale)
  switch / checkbox / theme toggle ... toggle
  segmented control .................. select
  pull-to-refresh triggered .......... impact
  destructive confirm ................ impact
  mutation success ................... success
  mutation error / validation fail ... error
  navigation push / pop / modal ...... none     (the OS transition is the feedback)

  Invariants:
  1. Fire on onPressIn, never onPress — the haptic must land with the finger.
  2. One haptic per gesture. Press-in `tap` plus a later `success` on the mutation
     settling is two events, not stacking. Two haptics on the same event is.
  3. Never await. expo-haptics rejects on unsupported hardware.
*/

export type HapticIntent =
  | "select"
  | "tap"
  | "toggle"
  | "impact"
  | "heavy"
  | "success"
  | "warning"
  | "error";

const run: Record<HapticIntent, () => Promise<void>> = {
  select: () => Haptics.selectionAsync(),
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  toggle: () => Haptics.selectionAsync(),
  impact: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

let enabled = true;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

export function haptic(intent: HapticIntent): void {
  if (!enabled) return;
  run[intent]().catch(() => {});
}

export function hapticFromWorklet(intent: HapticIntent): void {
  "worklet";
  runOnJS(haptic)(intent);
}

export const haptics = {
  select: () => haptic("select"),
  selection: () => haptic("select"),
  tap: () => haptic("tap"),
  toggle: () => haptic("toggle"),
  light: () => haptic("tap"),
  impact: () => haptic("impact"),
  medium: () => haptic("impact"),
  heavy: () => haptic("heavy"),
  success: () => haptic("success"),
  warning: () => haptic("warning"),
  error: () => haptic("error"),
};
