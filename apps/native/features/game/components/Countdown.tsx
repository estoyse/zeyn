import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Text } from "@/components/ui";
import { useCountdown } from "@/features/game/hooks/useCountdown";
import { haptic } from "@/lib/haptics";
import { SPRING } from "@/lib/motion";
import { NEON } from "@/lib/neon";
import { play } from "@/lib/sfx";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface CountdownProps {
  expiresAt: number;
  duration: number;
}

export function Countdown({ expiresAt, duration }: CountdownProps) {
  const { t } = useTranslation("game");
  const { remainingMs } = useCountdown(expiresAt, duration);
  const punch = useSharedValue(0);

  useAnimatedReaction(
    () => Math.max(0, Math.ceil(remainingMs.value / 1000)),
    (seconds, previous) => {
      if (previous === null || seconds === previous) return;
      punch.value = withSequence(
        withTiming(1, { duration: 70 }),
        withSpring(0, SPRING.bouncy)
      );
      if (seconds > 0) {
        runOnJS(haptic)("impact");
        runOnJS(play)("countdownTick");
      } else {
        runOnJS(haptic)("heavy");
        runOnJS(play)("countdownGo");
      }
    }
  );

  const digitProps = useAnimatedProps(() => {
    const seconds = Math.max(0, Math.ceil(remainingMs.value / 1000));
    const text = seconds > 0 ? String(seconds) : "";
    return { text, defaultValue: text } as never;
  });

  const digitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + punch.value * 0.22 }],
  }));

  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Text className="text-caption uppercase text-muted-foreground">
        {t("countdown.getReady")}
      </Text>

      <Animated.View style={digitStyle}>
        <AnimatedTextInput
          editable={false}
          pointerEvents="none"
          underlineColorAndroid="transparent"
          animatedProps={digitProps}
          style={styles.digit}
          value=""
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  digit: {
    padding: 0,
    margin: 0,
    includeFontPadding: false,
    textAlign: "center",
    minWidth: 140,
    fontSize: 120,
    fontWeight: "800",
    color: NEON.ringSafe,
  },
});
