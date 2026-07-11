import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";

interface TimerProps {
  expiresAt: number;
  duration?: number;
  onTimeout?: () => void;
}

export function Timer({ expiresAt, duration = 15000, onTimeout }: TimerProps) {
  const { t } = useTranslation("game");
  const [timeLeft, setTimeLeft] = useState(Math.max(0, expiresAt - Date.now()));
  const progress = useSharedValue(0);

  useEffect(() => {
    const remaining = Math.max(0, expiresAt - Date.now());
    progress.value = Math.min(100, (remaining / duration) * 100);
    progress.value = withTiming(0, {
      duration: remaining,
      easing: Easing.linear,
    });

    const interval = setInterval(() => {
      const left = Math.max(0, expiresAt - Date.now());
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        onTimeout?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [expiresAt, duration, onTimeout, progress]);

  const isUrgent = timeLeft < 5000;

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View className="w-full gap-2">
      <View className="flex-row justify-between">
        <Text
          className={cn(
            "text-muted-foreground text-xs",
            isUrgent && "text-destructive"
          )}
        >
          {isUrgent ? t("timer.hurryUp") : t("timer.timeRemaining")}
        </Text>
        <Text className="text-muted-foreground text-xs">
          {(timeLeft / 1000).toFixed(1)}s
        </Text>
      </View>
      <View className="h-3 w-full overflow-hidden border border-border bg-muted-surface p-px">
        <Animated.View
          style={barStyle}
          className={cn("h-full", isUrgent ? "bg-destructive" : "bg-brand")}
        />
      </View>
    </View>
  );
}
