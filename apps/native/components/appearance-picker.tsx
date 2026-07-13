import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { PressableScale, Text } from "@/components/ui";
import { setAppearance, usePrefs, type Appearance } from "@/lib/prefs";
import { cn } from "@/lib/utils";

const StyledIonicons = withUniwind(Ionicons);

const OPTIONS: { value: Appearance; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "light", icon: "sunny" },
  { value: "dark", icon: "moon" },
  { value: "system", icon: "phone-portrait" },
];

export function AppearancePicker() {
  const { t } = useTranslation("settings");
  const { appearance } = usePrefs();

  return (
    <View className="flex-row gap-1 rounded-pill bg-muted-surface p-1">
      {OPTIONS.map(option => {
        const active = appearance === option.value;

        return (
          <PressableScale
            key={option.value}
            haptic="select"
            onPress={() => setAppearance(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(`preferences.appearance.${option.value}`)}
            className={cn(
              "size-9 items-center justify-center rounded-pill",
              active && "bg-surface"
            )}
          >
            <StyledIonicons
              name={option.icon}
              size={16}
              className={active ? "text-foreground" : "text-muted-foreground"}
            />
          </PressableScale>
        );
      })}
    </View>
  );
}
