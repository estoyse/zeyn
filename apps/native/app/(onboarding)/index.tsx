import { type Href, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedRef,
  useAnimatedReaction,
  useDerivedValue,
  useScrollOffset,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, PressableScale, Screen, Text } from "@/components/ui";
import { Dots } from "@/features/onboarding/components/Dots";
import { Slide } from "@/features/onboarding/components/Slide";
import { onboardingSlides } from "@/features/onboarding/onboardingContent";
import { haptic } from "@/lib/haptics";
import { setSeenOnboarding } from "@/lib/onboarding-storage";

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation("onboarding");

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useScrollOffset(scrollRef);
  const [activeIndex, setActiveIndex] = useState(0);

  const progress = useDerivedValue(() =>
    width > 0 ? offset.value / width : 0
  );

  useAnimatedReaction(
    () => Math.round(progress.value),
    (page, previous) => {
      if (previous === null || page === previous) return;
      runOnJS(setActiveIndex)(page);
      runOnJS(haptic)("select");
    }
  );

  const isLastSlide = activeIndex === onboardingSlides.length - 1;

  const finish = useCallback(
    async (href: Href) => {
      await setSeenOnboarding();
      router.replace(href);
    },
    [router]
  );

  const next = () => {
    const target = Math.min(activeIndex + 1, onboardingSlides.length - 1);
    scrollRef.current?.scrollTo({ x: target * width, animated: true });
  };

  return (
    <Screen scroll={false} edges={["top", "bottom"]}>
      <View style={{ paddingTop: insets.top }} className="flex-row justify-end px-4">
        <PressableScale
          haptic={null}
          onPress={() => finish("/(tabs)/home")}
          className="px-3 py-2"
        >
          <Text weight="medium" className="text-muted-foreground">
            {t("skip")}
          </Text>
        </PressableScale>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {onboardingSlides.map((slide, index) => (
          <Slide
            key={slide.key}
            slide={slide}
            index={index}
            progress={progress}
            width={width}
          />
        ))}
      </Animated.ScrollView>

      <View className="gap-6 px-6 pb-6">
        <Dots count={onboardingSlides.length} progress={progress} />

        {isLastSlide ? (
          <View className="gap-3">
            <Button onPress={() => finish("/(auth)/login")}>
              <Button.Label>{t("createAccount")}</Button.Label>
            </Button>
            <Button variant="ghost" onPress={() => finish("/(tabs)/home")}>
              <Button.Label>{t("skipForNow")}</Button.Label>
            </Button>
          </View>
        ) : (
          <Button onPress={next}>
            <Button.Label>{t("next")}</Button.Label>
          </Button>
        )}
      </View>
    </Screen>
  );
}
