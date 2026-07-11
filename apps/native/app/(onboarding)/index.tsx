import { type Href, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Screen, Text } from "@/components/ui";
import { Dots } from "@/features/onboarding/components/Dots";
import { Slide } from "@/features/onboarding/components/Slide";
import { onboardingSlides } from "@/features/onboarding/onboardingContent";
import { setSeenOnboarding } from "@/lib/onboarding-storage";

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation("onboarding");
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === onboardingSlides.length - 1;

  const finish = useCallback(
    async (href: Href) => {
      await setSeenOnboarding();
      router.replace(href);
    },
    [router],
  );

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(nextIndex);
  }

  function handleNext() {
    const nextIndex = Math.min(activeIndex + 1, onboardingSlides.length - 1);
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    setActiveIndex(nextIndex);
  }

  return (
    <Screen scroll={false} edges={["top", "bottom"]}>
      <View style={{ paddingTop: insets.top }} className="flex-row justify-end px-6">
        <Text
          weight="medium"
          className="py-2 text-muted-foreground"
          onPress={() => finish("/(tabs)/home")}
        >
          {t("skip")}
        </Text>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        className="flex-1"
      >
        {onboardingSlides.map((slide, index) => (
          <Slide key={slide.key} slide={slide} isActive={index === activeIndex} width={width} />
        ))}
      </Animated.ScrollView>

      <View className="gap-6 px-6 pb-6">
        <Dots count={onboardingSlides.length} index={activeIndex} />

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
          <Button onPress={handleNext}>
            <Button.Label>{t("next")}</Button.Label>
          </Button>
        )}
      </View>
    </Screen>
  );
}
