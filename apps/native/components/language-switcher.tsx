import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, Text } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";

import { authClient } from "@/lib/auth-client";
import { setLocale, supportedLocales, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { data: session } = authClient.useSession();

  const currentLocale = i18n.language as Locale;

  const handlePress = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const currentIndex = supportedLocales.indexOf(currentLocale);
    const nextLocale = supportedLocales[(currentIndex + 1) % supportedLocales.length];
    setLocale(nextLocale);
    if (session?.user) {
      authClient.updateUser({ locale: nextLocale }).catch(() => {});
    }
  };

  return (
    <Pressable onPress={handlePress} className="px-2.5">
      <Animated.View key={currentLocale} entering={ZoomIn} exiting={FadeOut}>
        <Text className="text-foreground font-medium uppercase">{currentLocale}</Text>
      </Animated.View>
    </Pressable>
  );
}
