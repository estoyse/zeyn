import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { haptic as fireHaptic, type HapticIntent } from "@/lib/haptics";
import { PRESS, SPRING } from "@/lib/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, "style"> & {
  className?: string;
  style?: StyleProp<ViewStyle>;
  scale?: number;
  dim?: boolean;
  haptic?: HapticIntent | null;
};

export function PressableScale({
  scale = PRESS.scale,
  dim = false,
  haptic: intent = "tap",
  hitSlop = PRESS.hitSlop,
  pressRetentionOffset = { top: 12, bottom: 12, left: 12, right: 12 },
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: PressableScaleProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, scale]) }],
    opacity: dim ? interpolate(pressed.value, [0, 1], [1, PRESS.opacity]) : 1,
  }));

  return (
    <AnimatedPressable
      hitSlop={hitSlop}
      pressRetentionOffset={pressRetentionOffset}
      disabled={disabled}
      style={[animatedStyle, style]}
      onPressIn={(event) => {
        pressed.value = withSpring(1, SPRING.press);
        if (intent && !disabled) fireHaptic(intent);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withSpring(0, SPRING.press);
        onPressOut?.(event);
      }}
      {...rest}
    />
  );
}
