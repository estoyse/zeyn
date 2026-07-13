import { useEffect } from "react";
import { StyleSheet, TextInput, type TextStyle } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { DUR, EASE_OUT } from "@/lib/motion";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type AnimatedNumberProps = {
  value: number;
  style?: TextStyle | TextStyle[];
  duration?: number;
  prefixSign?: boolean;
};

export function AnimatedNumber({
  value,
  style,
  duration = DUR.slow,
  prefixSign = false,
}: AnimatedNumberProps) {
  const animated = useSharedValue(value);

  useEffect(() => {
    animated.value = withTiming(value, { duration, easing: EASE_OUT });
  }, [value, duration, animated]);

  const animatedProps = useAnimatedProps(() => {
    const rounded = Math.round(animated.value);
    const text =
      prefixSign && rounded > 0 ? `+${rounded}` : String(rounded);
    return { text, defaultValue: text } as never;
  });

  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      animatedProps={animatedProps}
      style={[styles.base, style]}
      value={String(value)}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    padding: 0,
    margin: 0,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
