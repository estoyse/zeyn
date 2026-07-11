import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { Heading, Text } from "@/components/ui";
import { fadeUp, scaleIn, stagger } from "@/lib/motion";
import { useAppColor } from "@/lib/theme";

import { type OnboardingSlide } from "../onboardingContent";

type SlideProps = {
  slide: OnboardingSlide;
  isActive: boolean;
  width: number;
};

export function Slide({ slide, isActive, width }: SlideProps) {
  const { t } = useTranslation("onboarding");
  const [brand] = useAppColor(["brand"]);

  return (
    <View style={{ width }} className="flex-1 items-center justify-center gap-6 px-10">
      {isActive ? (
        <>
          <Animated.View
            entering={scaleIn()}
            className="size-24 items-center justify-center rounded-full bg-brand/10"
          >
            <Ionicons name={slide.icon} size={44} color={brand} />
          </Animated.View>

          <View className="items-center gap-3">
            <Animated.View entering={fadeUp(stagger(1))}>
              <Heading className="text-center text-2xl">{t(slide.titleKey)}</Heading>
            </Animated.View>
            <Animated.View entering={fadeUp(stagger(2))}>
              <Text className="text-center text-base text-muted-foreground">
                {t(slide.descKey)}
              </Text>
            </Animated.View>
          </View>
        </>
      ) : null}
    </View>
  );
}
