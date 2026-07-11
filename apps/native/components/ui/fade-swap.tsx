import type { ReactNode } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { fadeIn, fadeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

type FadeSwapProps = {
  swapKey: string;
  className?: string;
  children: ReactNode;
};

export function FadeSwap({ swapKey, className, children }: FadeSwapProps) {
  return (
    <View className={cn(className)}>
      <Animated.View key={swapKey} entering={fadeIn()} exiting={fadeOut()}>
        {children}
      </Animated.View>
    </View>
  );
}
