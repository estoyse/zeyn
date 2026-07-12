import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated";

import { Text } from "@/components/ui";
import { useCountdown } from "@/features/game/hooks/useCountdown";
import { haptic } from "@/lib/haptics";
import { play } from "@/lib/sfx";
import { useAppColor, useThemeColor } from "@/lib/theme";

interface TimerProps {
  expiresAt: number;
  duration?: number;
  underClock?: boolean;
}

export function Timer({ expiresAt, duration = 15000, underClock = false }: TimerProps) {
  const { t } = useTranslation("game");
  const { progress, remainingMs, urgency } = useCountdown(expiresAt, duration);
  const [warning] = useThemeColor(["warning"]);
  const [brand, destructive] = useAppColor(["brand", "destructive"]);

  useAnimatedReaction(
    () => Math.ceil(remainingMs.value / 1000),
    (seconds, previous) => {
      if (!underClock || previous === null || seconds === previous) return;
      if (seconds <= 3 && seconds > 0) {
        runOnJS(haptic)("tap");
        runOnJS(play)("tick");
      }
    },
    [underClock]
  );

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: interpolateColor(
      progress.value,
      [0, 0.13, 0.33, 1],
      [destructive, destructive, warning, brand]
    ),
  }));

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: interpolate(urgency.value, [0, 1], [1, 1.25]) }],
  }));

  const idleLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(urgency.value, [0, 0.6], [1, 0]),
  }));

  const urgentLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(urgency.value, [0.6, 1], [0, 1]),
  }));

  return (
    <View className="w-full gap-2">
      <View className="h-4 justify-center">
        <Animated.View style={idleLabelStyle} className="absolute">
          <Text className="text-caption uppercase text-muted-foreground">
            {t("timer.timeRemaining")}
          </Text>
        </Animated.View>
        <Animated.View style={urgentLabelStyle} className="absolute">
          <Text className="text-caption uppercase text-destructive">
            {t("timer.hurryUp")}
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        style={trackStyle}
        className="h-2 w-full overflow-hidden rounded-pill bg-muted-surface"
      >
        <Animated.View style={barStyle} className="h-full rounded-pill" />
      </Animated.View>
    </View>
  );
}
