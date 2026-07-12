import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { PressableScale, Text } from "@/components/ui";
import { setLocale, supportedLocales, type Locale } from "@/i18n/config";
import { authClient } from "@/lib/auth-client";
import { haptic } from "@/lib/haptics";
import { useThemeColor } from "@/lib/theme";
import { cn } from "@/lib/utils";

const StyledIonicons = withUniwind(Ionicons);

const LOCALE_LABEL: Record<string, string> = {
  uz: "O‘zbekcha",
  ru: "Русский",
  en: "English",
};

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation("settings");
  const { data: session } = authClient.useSession();
  const sheet = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [surface, foreground] = useThemeColor(["surface", "foreground"]);

  const current = i18n.language as Locale;

  const pick = (locale: Locale) => {
    setLocale(locale);
    if (session?.user) {
      authClient.updateUser({ locale }).catch(() => {});
    }
    sheet.current?.dismiss();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <>
      <PressableScale
        haptic="tap"
        onPress={() => sheet.current?.present()}
        accessibilityRole="button"
        accessibilityLabel={t("preferences.language.label")}
        className="flex-row items-center gap-1.5 rounded-pill bg-muted-surface px-3 py-2"
      >
        <Text weight="medium" className="text-sm">
          {LOCALE_LABEL[current] ?? current}
        </Text>
        <StyledIonicons
          name="chevron-down"
          size={13}
          className="text-muted-foreground"
        />
      </PressableScale>

      <BottomSheetModal
        ref={sheet}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: foreground, opacity: 0.25 }}
        backgroundStyle={{ backgroundColor: surface }}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 12 }}>
          <View className="gap-1 px-4 pb-2 pt-1">
            <Text weight="semibold" className="px-2 pb-2 text-base">
              {t("preferences.language.label")}
            </Text>

            {supportedLocales.map(locale => {
              const active = locale === current;

              return (
                <PressableScale
                  key={locale}
                  haptic="select"
                  onPress={() => pick(locale)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  className={cn(
                    "h-12 flex-row items-center justify-between rounded-row px-3",
                    active && "bg-muted-surface"
                  )}
                >
                  <Text weight={active ? "semibold" : "regular"} className="text-base">
                    {LOCALE_LABEL[locale] ?? locale}
                  </Text>
                  {active && (
                    <StyledIonicons name="checkmark" size={18} className="text-brand" />
                  )}
                </PressableScale>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
