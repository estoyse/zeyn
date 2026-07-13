import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { PRESS } from "@/lib/motion";
import { useThemeColor } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { PressableScale } from "./pressable-scale";
import { useScrollOffsetContext } from "./screen";
import { Heading } from "./text";

type ScreenHeaderProps = {
  title?: string;
  back?: boolean;
  right?: ReactNode;
  className?: string;
};

export function ScreenHeader({ title, back = false, right, className }: ScreenHeaderProps) {
  const { t } = useTranslation("common");
  const offset = useScrollOffsetContext();
  const [foreground] = useThemeColor(["foreground"]);

  const hairlineStyle = useAnimatedStyle(() => ({
    opacity: offset
      ? interpolate(offset.value, [0, 12], [0, 1], Extrapolation.CLAMP)
      : 0,
  }));

  return (
    <View className={cn("h-12 flex-row items-center gap-1 px-2", className)}>
      {back ? (
        <PressableScale
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/(tabs)/home")
          }
          haptic={null}
          hitSlop={12}
          scale={PRESS.scaleIcon}
          accessibilityRole="button"
          accessibilityLabel={t("back")}
          className="size-11 items-center justify-center"
        >
          <Ionicons
            name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
            size={24}
            color={foreground}
          />
        </PressableScale>
      ) : (
        <View className="w-2" />
      )}

      {title ? (
        <Heading numberOfLines={1} className="flex-1 text-title-3">
          {title}
        </Heading>
      ) : (
        <View className="flex-1" />
      )}

      {right}

      <Animated.View
        style={hairlineStyle}
        pointerEvents="none"
        className="absolute inset-x-0 bottom-0 h-px bg-separator"
      />
    </View>
  );
}
