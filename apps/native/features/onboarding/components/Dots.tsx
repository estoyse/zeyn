import { View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

import { cn } from "@/lib/utils";

type DotProps = {
  active: boolean;
};

function Dot({ active }: DotProps) {
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 24 : 8, { duration: 250 }),
    opacity: withTiming(active ? 1 : 0.4, { duration: 250 }),
  }));

  return (
    <Animated.View
      style={style}
      className={cn("h-2 rounded-full", active ? "bg-brand" : "bg-muted-foreground")}
    />
  );
}

type DotsProps = {
  count: number;
  index: number;
};

export function Dots({ count, index }: DotsProps) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} active={i === index} />
      ))}
    </View>
  );
}
