import { View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { useAppColor } from "@/lib/theme";

type DotsProps = {
  count: number;
  progress: SharedValue<number>;
};

export function Dots({ count, progress }: DotsProps) {
  const [brand, mutedForeground] = useAppColor(["brand", "mutedForeground"]);

  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <Dot
          key={index}
          index={index}
          progress={progress}
          activeColor={brand}
          idleColor={mutedForeground}
        />
      ))}
    </View>
  );
}

function Dot({
  index,
  progress,
  activeColor,
  idleColor,
}: {
  index: number;
  progress: SharedValue<number>;
  activeColor: string;
  idleColor: string;
}) {
  const style = useAnimatedStyle(() => {
    const distance = Math.min(Math.abs(progress.value - index), 1);

    return {
      width: interpolate(distance, [0, 1], [24, 8], Extrapolation.CLAMP),
      opacity: interpolate(distance, [0, 1], [1, 0.4], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(
        distance,
        [0, 1],
        [activeColor, idleColor]
      ),
    };
  });

  return <Animated.View style={style} className="h-2 rounded-full" />;
}
