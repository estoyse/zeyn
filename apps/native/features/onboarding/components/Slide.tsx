import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { Heading, Text } from "@/components/ui";
import { useAppColor } from "@/lib/theme";

import { type OnboardingSlide } from "../onboardingContent";

type SlideProps = {
  slide: OnboardingSlide;
  index: number;
  progress: SharedValue<number>;
  width: number;
};

export function Slide({ slide, index, progress, width }: SlideProps) {
  const { t } = useTranslation("onboarding");
  const [brand] = useAppColor(["brand"]);

  const iconStyle = useAnimatedStyle(() => {
    const distance = progress.value - index;
    const magnitude = Math.min(Math.abs(distance), 1);

    return {
      opacity: interpolate(magnitude, [0, 0.85], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: distance * width * 0.35 },
        { scale: interpolate(magnitude, [0, 1], [1, 0.72], Extrapolation.CLAMP) },
      ],
    };
  });

  const copyStyle = useAnimatedStyle(() => {
    const distance = progress.value - index;
    const magnitude = Math.min(Math.abs(distance), 1);

    return {
      opacity: interpolate(magnitude, [0, 0.6], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateX: distance * width * 0.18 }],
    };
  });

  return (
    <View style={{ width }} className="flex-1 items-center justify-center gap-6 px-10">
      <Animated.View
        style={iconStyle}
        className="size-24 items-center justify-center rounded-full bg-brand/10"
      >
        <Ionicons name={slide.icon} size={44} color={brand} />
      </Animated.View>

      <Animated.View style={copyStyle} className="items-center gap-3">
        <Heading className="text-center text-title-2">{t(slide.titleKey)}</Heading>
        <Text className="text-center text-base text-muted-foreground">
          {t(slide.descKey)}
        </Text>
      </Animated.View>
    </View>
  );
}
